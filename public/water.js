// SpiritBeach — mar interactivo (WebGL): ondas ambientales + ripples que siguen el mouse
(function () {
  const host = document.querySelector('.planet .bg');
  if (!host) return;
  const img = host.querySelector('img');
  if (!img) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return; // respetar reduced-motion: se queda la foto estática

  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
  if (!gl) return; // sin WebGL: fallback a la imagen

  const MAX_R = 10; // ripples simultáneos

  const vsrc = `
    attribute vec2 aPos;
    varying vec2 vUv;
    void main(){ vUv = aPos * .5 + .5; gl_Position = vec4(aPos, 0., 1.); }`;

  const fsrc = `
    precision mediump float;
    varying vec2 vUv;
    uniform sampler2D uTex;
    uniform float uTime;
    uniform vec2 uRes;
    uniform vec2 uTexRes;
    uniform vec4 uRip[${MAX_R}]; // x, y, startTime, fuerza
    void main(){
      // cover: escala la textura como object-fit cover
      vec2 uv = vUv;
      float ra = uRes.x / uRes.y;
      float ta = uTexRes.x / uTexRes.y;
      if (ra > ta) { uv.y = (uv.y - .5) * (ta / ra) + .5; }
      else { uv.x = (uv.x - .5) * (ra / ta) + .5; }
      uv.y = 1. - uv.y;

      // oleaje ambiental visible (tipo video): dos trenes de olas + swell lento
      vec2 off = vec2(
        sin(uv.y * 16. + uTime * 1.1) * .5 + sin(uv.y * 6. - uTime * .55) * .8 + sin((uv.x + uv.y) * 9. + uTime * .8) * .4,
        cos(uv.x * 13. + uTime * .9) * .5 + sin(uv.x * 4.5 + uTime * .45) * .8 + cos((uv.x - uv.y) * 8. - uTime * .7) * .4
      ) * .006;

      // ripples del mouse (estela)
      for (int i = 0; i < ${MAX_R}; i++) {
        vec4 r = uRip[i];
        if (r.w <= 0.) continue;
        float age = uTime - r.z;
        if (age < 0. || age > 3.5) continue;
        vec2 d = vUv - r.xy;
        d.x *= uRes.x / uRes.y;
        float dist = length(d);
        float wave = sin(dist * 38. - age * 8.) * exp(-dist * 5.) * exp(-age * 1.4);
        off += normalize(d + 1e-5) * wave * .03 * r.w;
      }

      vec3 col = texture2D(uTex, clamp(uv + off, .002, .998)).rgb;
      // brillo especular en las crestas + destello que recorre
      float spec = (off.x + off.y) * 10.;
      float glint = pow(max(0., sin(uv.x * 3. - uTime * .35) * sin(uv.y * 2.5 + uTime * .25)), 6.) * .06;
      col += spec * vec3(.12, .14, .12) + glint;
      gl_FragColor = vec4(col, 1.);
    }`;

  function sh(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  }
  const vs = sh(gl.VERTEX_SHADER, vsrc);
  const fs = sh(gl.FRAGMENT_SHADER, fsrc);
  if (!vs || !fs) return;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uTime = gl.getUniformLocation(prog, 'uTime');
  const uRes = gl.getUniformLocation(prog, 'uRes');
  const uTexRes = gl.getUniformLocation(prog, 'uTexRes');
  const uRip = gl.getUniformLocation(prog, 'uRip[0]') || gl.getUniformLocation(prog, 'uRip');

  const ripples = new Float32Array(MAX_R * 4);
  let ripIdx = 0;
  function splash(x, y, force) {
    ripples[ripIdx * 4] = x;
    ripples[ripIdx * 4 + 1] = y;
    ripples[ripIdx * 4 + 2] = now();
    ripples[ripIdx * 4 + 3] = force;
    ripIdx = (ripIdx + 1) % MAX_R;
  }

  const t0 = performance.now();
  const now = () => (performance.now() - t0) / 1000;

  // textura desde la imagen existente
  const tex = gl.createTexture();
  let texW = 2, texH = 2;
  function loadTex() {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    texW = img.naturalWidth; texH = img.naturalHeight;
    canvas.style.opacity = '1';
  }
  if (img.complete && img.naturalWidth) loadTex();
  else img.addEventListener('load', loadTex);

  canvas.style.opacity = '0';
  canvas.style.transition = 'opacity .8s';
  host.appendChild(canvas);

  function resize() {
    const r = host.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener('resize', resize);

  // interacción
  const section = host.closest('.planet');
  let lastMove = 0;
  section.addEventListener('pointermove', (e) => {
    const t = performance.now();
    if (t - lastMove < 45) return; // estela continua
    lastMove = t;
    const r = host.getBoundingClientRect();
    splash((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height, 1.5);
  });
  section.addEventListener('pointerdown', (e) => {
    const r = host.getBoundingClientRect();
    splash((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height, 2.6);
  });

  // gotas automáticas para que el mar viva solo
  setInterval(() => splash(0.15 + Math.random() * 0.7, 0.2 + Math.random() * 0.6, 0.9), 1800);

  // pausar cuando no está en pantalla
  let visible = true;
  new IntersectionObserver((en) => { visible = en[0].isIntersecting; }, { threshold: 0.05 }).observe(section);

  function frame() {
    if (visible) {
      gl.uniform1f(uTime, now());
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uTexRes, texW, texH);
      gl.uniform4fv(uRip, ripples);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    requestAnimationFrame(frame);
  }
  frame();
})();
