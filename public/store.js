// SpiritBeach — carrito, wishlist y pedidos (localStorage)
(function () {
  const CART_KEY = 'sb-cart';
  const WISH_KEY = 'sb-wish';
  const ORD_KEY = 'sb-orders';
  const WA_NUM = '584246535755';

  const read = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch (e) { return fb; } };
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const money = (n) => '$' + n.toFixed(2);
  const findP = (slug) => (typeof PRODUCTS !== 'undefined' ? PRODUCTS.find((p) => p.slug === slug) : null);

  let cart = read(CART_KEY, []);

  /* ---------- UI: drawer + overlay + toast + top ---------- */
  const overlay = document.createElement('div');
  overlay.className = 'cart-overlay';
  const drawer = document.createElement('aside');
  drawer.className = 'cart';
  drawer.setAttribute('aria-label', 'Carrito de compras');
  drawer.innerHTML = `
    <div class="cart-head">
      <h3 data-title>Tu carrito<span class="cart-count" data-count hidden></span></h3>
      <button class="cart-close" aria-label="Cerrar carrito"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    </div>
    <div class="cart-view" data-view="cart">
      <div class="cart-items"></div>
      <div class="cart-foot">
        <div class="cart-total"><span>Total</span><strong data-total>$0.00</strong></div>
        <div class="total-bs" data-bs></div>
        <div class="cart-ship">El envío se calcula al coordinar la entrega</div>
        <button class="btn btn-olive btn-block" data-goto-checkout>Continuar con el pedido →</button>
        <div class="cart-note">Coordinamos pago y envío por WhatsApp · Envíos a toda Venezuela</div>
      </div>
    </div>
    <div class="cart-view" data-view="checkout" hidden>
      <form class="co-form" novalidate>
        <div class="co-steps">
          <span class="on"><span class="dot">1</span></span><span class="on">Carrito</span>
          <span class="sep"></span>
          <span class="on"><span class="dot">2</span></span><span class="on">Tus datos</span>
          <span class="sep"></span>
          <span><span class="dot">3</span></span><span>WhatsApp</span>
        </div>
        <button type="button" class="co-back">← Volver al carrito</button>
        <div class="co-summary" data-summary></div>
        <div class="co-coupon">
          <div class="co-coupon-field">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="1.6"><path d="M20 12l-8.5 8.5a2 2 0 0 1-2.8 0L3 14.8a2 2 0 0 1 0-2.8L11.5 3.5H18a2 2 0 0 1 2 2V12z"/><circle cx="15.5" cy="8.5" r="1.3"/></svg>
            <input name="cupon" type="text" placeholder="Cupón (ej: SPIRIT10)" autocomplete="off" />
          </div>
          <button type="button" class="btn-apply" data-apply-coupon>Aplicar</button>
        </div>
        <div class="cup-msg" data-cup-msg></div>
        <div>
          <label>¿Cómo lo quieres recibir?</label>
          <div class="chips-row" data-entrega-chips>
            <button type="button" class="chip-opt" data-entrega="Pick up">Pick up</button>
            <button type="button" class="chip-opt" data-entrega="Delivery">Delivery</button>
            <button type="button" class="chip-opt active" data-entrega="Envío">Envío</button>
          </div>
          <div class="co-help" data-entrega-help>Envío nacional por encomienda (MRW / Zoom). Costo por cobrar.</div>
        </div>
        <div>
          <label>Método de pago</label>
          <div class="chips-row" data-pago-chips>
            <button type="button" class="chip-opt active" data-pago="Pago Móvil">Pago Móvil</button>
            <button type="button" class="chip-opt" data-pago="Zelle">Zelle</button>
            <button type="button" class="chip-opt" data-pago="Binance">Binance</button>
            <button type="button" class="chip-opt" data-pago="Efectivo">Efectivo</button>
          </div>
        </div>
        <div><input name="nombre" type="text" autocomplete="name" placeholder="Tu nombre (opcional)" /></div>
        <div><input name="whatsapp" type="tel" autocomplete="tel" inputmode="tel" placeholder="Tu WhatsApp (opcional)" /></div>
        <div><textarea name="nota" placeholder="Nota / dirección (opcional)"></textarea></div>
      </form>
      <div class="cart-foot">
        <div class="disc-line" data-disc hidden></div>
        <div class="cart-total"><span>Total</span><strong data-total-2>$0.00</strong></div>
        <div class="total-bs" data-bs-2></div>
        <button class="btn btn-wa btn-block" data-checkout>
          <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.2 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-1.7 0-.4-.1-.9-.3-1.6-.6-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.4l.9 2.1c.1.2.1.4 0 .6l-.4.6-.5.5c-.1.1-.3.3-.1.6.1.3.7 1.1 1.5 1.8 1 .9 1.8 1.2 2.1 1.3.3.1.4.1.6-.1l.9-1c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.6.3 0 .1 0 .7-.2 1.1z"/></svg>
          Enviar pedido por WhatsApp
        </button>
        <div class="cart-note">Al enviar se abre WhatsApp con tu pedido listo · Solo confirmas</div>
      </div>
    </div>`;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  const topBtn = document.createElement('button');
  topBtn.className = 'top-btn';
  topBtn.setAttribute('aria-label', 'Volver arriba');
  topBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  document.addEventListener('DOMContentLoaded', () => {
    document.body.append(overlay, drawer, toast, topBtn);
    bindBag();
    renderCart();
    updateBadge();
  });

  let toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
  }

  function openCart() { drawer.classList.add('open'); overlay.classList.add('open'); }
  function closeCart() { drawer.classList.remove('open'); overlay.classList.remove('open'); }
  overlay.addEventListener('click', closeCart);
  drawer.addEventListener('click', (e) => { if (e.target.closest('.cart-close')) closeCart(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCart(); });

  function bindBag() {
    document.querySelectorAll('.nav-right a[aria-label="Bolsa"]').forEach((a) => {
      a.classList.add('bag-link');
      const b = document.createElement('span');
      b.className = 'bag-badge';
      b.hidden = true;
      a.appendChild(b);
      a.addEventListener('click', (e) => { e.preventDefault(); openCart(); });
    });
  }

  function updateBadge() {
    const n = cart.reduce((s, i) => s + i.qty, 0);
    document.querySelectorAll('.bag-badge:not(.fav-badge)').forEach((b) => { b.hidden = n === 0; b.textContent = n; });
    const c = drawer.querySelector('[data-count]');
    if (c) { c.hidden = n === 0; c.textContent = n + (n === 1 ? ' pieza' : ' piezas'); }
    const w = read(WISH_KEY, []).length;
    document.querySelectorAll('.fav-badge').forEach((b) => { b.hidden = w === 0; b.textContent = w; });
  }

  /* ---------- carrito ---------- */
  function add(slug, size, qty) {
    const p = findP(slug);
    if (!p) return;
    size = size || p.sizes[0];
    qty = qty || 1;
    const hit = cart.find((i) => i.slug === slug && i.size === size);
    if (hit) hit.qty += qty; else cart.push({ slug, size, qty });
    if (window.SBTrack) window.SBTrack.event('add_to_cart', { productId: p.id }); // embudo
    write(CART_KEY, cart);
    renderCart(); updateBadge();
    showToast(p.name + ' (' + size + ') añadido al carrito');
    openCart();
  }
  function setQty(slug, size, qty) {
    const hit = cart.find((i) => i.slug === slug && i.size === size);
    if (!hit) return;
    hit.qty = qty;
    if (hit.qty <= 0) cart = cart.filter((i) => i !== hit);
    write(CART_KEY, cart);
    renderCart(); updateBadge();
  }
  function total() {
    return cart.reduce((s, i) => { const p = findP(i.slug); return s + (p ? p.price * i.qty : 0); }, 0);
  }

  /* ---------- cupón + moneda ---------- */
  let coupon = null; // {code, pct}
  let entrega = 'Envío';
  let pago = 'Pago Móvil';
  const ENTREGA_HELP = {
    'Pick up': 'Retiro personal en Maracaibo. Coordinamos el punto por WhatsApp.',
    'Delivery': 'Delivery en Maracaibo. El costo depende de la zona.',
    'Envío': 'Envío nacional por encomienda (MRW / Zoom). Costo por cobrar.',
  };
  function discount() { return coupon ? total() * coupon.pct / 100 : 0; }
  function totalNet() { return Math.max(0, total() - discount()); }
  function bs(n) {
    const tasa = (typeof getTasa === 'function') ? getTasa() : 166;
    return 'Bs ' + (n * tasa).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function refreshTotals() {
    const t = totalNet();
    const set = (sel, v) => { const el = drawer.querySelector(sel); if (el) el.textContent = v; };
    set('[data-total]', money(t));
    set('[data-total-2]', money(t));
    set('[data-bs]', cart.length ? bs(t) : '');
    set('[data-bs-2]', cart.length ? bs(t) : '');
    const d = drawer.querySelector('[data-disc]');
    if (d) {
      d.hidden = !coupon;
      if (coupon) d.textContent = 'Cupón ' + coupon.code + ' aplicado · −' + coupon.pct + '% (−' + money(discount()) + ')';
    }
  }

  function renderCart() {
    const box = drawer.querySelector('.cart-items');
    box.textContent = '';
    if (!cart.length) {
      box.innerHTML = '<div class="cart-empty"><img src="/lotus-olive.svg" alt="" /><span class="serif">Tu carrito está vacío</span>Explora la colección y encuentra tu pieza.<br /><a class="btn btn-olive" href="/tienda">Ver la tienda</a></div>';
    } else {
      cart.forEach((i) => {
        const p = findP(i.slug);
        if (!p) return;
        const row = document.createElement('div');
        row.className = 'ci';
        const img = document.createElement('img');
        img.src = '/products/' + p.slug + '.jpg';
        img.alt = p.name;
        const mid = document.createElement('div');
        const n = document.createElement('div'); n.className = 'n'; n.textContent = p.name;
        const m = document.createElement('div'); m.className = 'm'; m.textContent = 'Talla ' + i.size;
        const pr = document.createElement('div'); pr.className = 'p'; pr.textContent = money(p.price) + ' c/u';
        const q = document.createElement('div'); q.className = 'qty'; q.style.marginTop = '10px';
        const minus = document.createElement('button'); minus.textContent = '−'; minus.setAttribute('aria-label', 'Quitar uno');
        const num = document.createElement('span'); num.textContent = i.qty;
        const plus = document.createElement('button'); plus.textContent = '+'; plus.setAttribute('aria-label', 'Añadir uno');
        minus.addEventListener('click', () => setQty(i.slug, i.size, i.qty - 1));
        plus.addEventListener('click', () => setQty(i.slug, i.size, i.qty + 1));
        q.append(minus, num, plus);
        mid.append(n, m, pr, q);
        const right = document.createElement('div');
        right.className = 'ci-right';
        const del = document.createElement('button');
        del.className = 'ci-del';
        del.setAttribute('aria-label', 'Eliminar del carrito');
        del.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6"><path d="M4 7h16M9 7V5h6v2m-8 0l1 13h8l1-13"/></svg>';
        del.addEventListener('click', () => setQty(i.slug, i.size, 0));
        const sub = document.createElement('strong');
        sub.style.fontSize = '14px';
        sub.textContent = money(p.price * i.qty);
        right.append(del, sub);
        row.append(img, mid, right);
        box.appendChild(row);
      });
    }
    refreshTotals();
    renderSummary();
  }

  /* ---------- checkout (estilo Atenas: datos + entrega + pago) ---------- */
  function setView(name) {
    drawer.querySelectorAll('.cart-view').forEach((v) => { v.hidden = v.dataset.view !== name; });
    const title = drawer.querySelector('[data-title]');
    title.childNodes[0].textContent = name === 'checkout' ? 'Tu pedido' : 'Tu carrito';
  }

  function renderSummary() {
    const box = drawer.querySelector('[data-summary]');
    if (!box) return;
    box.textContent = '';
    cart.forEach((i) => {
      const p = findP(i.slug);
      if (!p) return;
      const line = document.createElement('div');
      line.className = 'line';
      const l = document.createElement('span');
      l.textContent = p.name + ' · ' + i.size + ' × ' + i.qty;
      const r = document.createElement('strong');
      r.textContent = money(p.price * i.qty);
      line.append(l, r);
      box.appendChild(line);
    });
    if (coupon) {
      const dl = document.createElement('div');
      dl.className = 'line';
      const l = document.createElement('span'); l.textContent = 'Cupón ' + coupon.code;
      const r = document.createElement('strong'); r.style.color = 'var(--pink-deep)'; r.textContent = '−' + money(discount());
      dl.append(l, r);
      box.appendChild(dl);
    }
    const tot = document.createElement('div');
    tot.className = 'line';
    tot.style.borderTop = '1px solid rgba(43,42,24,.15)';
    tot.style.paddingTop = '6px';
    const l = document.createElement('span'); l.textContent = 'Total';
    const r = document.createElement('strong'); r.textContent = money(totalNet());
    tot.append(l, r);
    box.appendChild(tot);
  }

  drawer.addEventListener('click', (e) => {
    if (e.target.closest('[data-goto-checkout]')) {
      if (!cart.length) { showToast('Tu carrito está vacío'); return; }
      renderSummary();
      // autollenar con el perfil de la cuenta (si existe)
      const prof = read('sb-profile', {});
      const form = drawer.querySelector('.co-form');
      if (form) {
        const n = form.querySelector('[name=nombre]');
        const w = form.querySelector('[name=whatsapp]');
        if (n && !n.value && prof.nombre) n.value = prof.nombre;
        if (w && !w.value && prof.whatsapp) w.value = prof.whatsapp;
      }
      setView('checkout');
      return;
    }
    if (e.target.closest('.co-back')) { setView('cart'); return; }

    // chips de entrega / pago
    const chE = e.target.closest('[data-entrega]');
    if (chE) {
      entrega = chE.dataset.entrega;
      drawer.querySelectorAll('[data-entrega]').forEach((c) => c.classList.toggle('active', c === chE));
      const h = drawer.querySelector('[data-entrega-help]');
      if (h) h.textContent = ENTREGA_HELP[entrega];
      return;
    }
    const chP = e.target.closest('[data-pago]');
    if (chP) {
      pago = chP.dataset.pago;
      drawer.querySelectorAll('[data-pago]').forEach((c) => c.classList.toggle('active', c === chP));
      return;
    }

    // aplicar cupón (validado contra el backend; respaldo local sin conexión)
    if (e.target.closest('[data-apply-coupon]')) {
      const inp = drawer.querySelector('[name=cupon]');
      const msg = drawer.querySelector('[data-cup-msg]');
      const code = (inp.value || '').trim().toUpperCase();
      if (!code) {
        coupon = null;
        msg.textContent = 'Escribe un cupón.';
        msg.className = 'cup-msg bad';
        renderSummary(); refreshTotals();
        return;
      }
      msg.textContent = 'Validando…';
      msg.className = 'cup-msg ok';
      (async () => {
        let ok = false, pct = 0, err = 'Ese cupón no es válido.';
        try {
          const r = await fetch(API + '/api/coupons/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, total: total() }),
          });
          const d = await r.json().catch(() => ({}));
          if (d.ok) { ok = true; pct = d.percent; }
          else if (d.error) err = d.error;
        } catch (e2) {
          const valid = (typeof getCoupons === 'function') ? getCoupons() : {};
          if (valid[code]) { ok = true; pct = valid[code]; }
        }
        if (ok) {
          coupon = { code, pct };
          msg.textContent = '✓ Cupón ' + code + ' aplicado: −' + pct + '%';
          msg.className = 'cup-msg ok';
          showToast('Cupón aplicado: −' + pct + '%');
        } else {
          coupon = null;
          msg.textContent = err;
          msg.className = 'cup-msg bad';
        }
        renderSummary(); refreshTotals();
      })();
      return;
    }

    if (!e.target.closest('[data-checkout]')) return;
    if (!cart.length) { showToast('Tu carrito está vacío'); return; }

    const form = drawer.querySelector('.co-form');
    const val = (n) => (form.querySelector('[name=' + n + ']')?.value || '').trim();
    const nombre = val('nombre'), whatsapp = val('whatsapp'), nota = val('nota');

    const lines = ['Hola SpiritBeach! Quiero hacer este pedido:', ''];
    cart.forEach((i) => {
      const p = findP(i.slug);
      if (p) lines.push('• ' + p.name + ' — Talla ' + i.size + ' × ' + i.qty + ' = ' + money(p.price * i.qty));
    });
    lines.push('');
    if (coupon) lines.push('Cupón ' + coupon.code + ': −' + coupon.pct + '% (−' + money(discount()) + ')');
    lines.push('Total: ' + money(totalNet()) + ' (' + bs(totalNet()) + ')', '');
    lines.push('Entrega: ' + entrega + ' — ' + ENTREGA_HELP[entrega]);
    lines.push('Pago: ' + pago);
    if (nombre) lines.push('Nombre: ' + nombre);
    if (whatsapp) lines.push('WhatsApp: ' + whatsapp);
    if (nota) lines.push('Nota: ' + nota);

    const orders = read(ORD_KEY, []);
    orders.push({
      id: 'SB-' + Date.now().toString(36).toUpperCase(),
      date: new Date().toISOString(),
      status: 'Nuevo',
      customer: { nombre, whatsapp, entrega, pago, nota },
      coupon: coupon ? coupon.code : null,
      items: cart.map((i) => { const p = findP(i.slug); return { name: p ? p.name : i.slug, size: i.size, qty: i.qty, price: p ? p.price : 0 }; }),
      total: totalNet(),
    });
    write(ORD_KEY, orders);
    // la cuenta se crea sola: guardar el perfil con los datos del checkout
    if (nombre || whatsapp) {
      const prof = read('sb-profile', {});
      write('sb-profile', { ...prof, nombre: nombre || prof.nombre || '', whatsapp: whatsapp || prof.whatsapp || '' });
    }
    // registrar el pedido en el backend (dashboard de la tienda)
    try {
      fetch(API + '/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          items: cart.map((i) => {
            const p = findP(i.slug);
            return { id: p && p.id, name: p ? p.name : i.slug, size: i.size, qty: i.qty, price: p ? p.price : 0 };
          }),
          total: totalNet(),
          customer: nombre,
          phone: whatsapp,
          note: nota,
          method: pago,
          delivery: entrega,
          coupon: coupon ? coupon.code : '',
        }),
      }).catch(() => {});
    } catch (e2) { /* noop */ }
    if (window.SBTrack) window.SBTrack.event('order'); // embudo: pedido iniciado
    window.open('https://wa.me/' + WA_NUM + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
    cart = [];
    coupon = null;
    write(CART_KEY, cart);
    renderCart(); updateBadge();
    setView('cart');
    closeCart();
    showToast('Pedido enviado — te esperamos en WhatsApp');
  });

  /* ---------- wishlist ---------- */
  function isWished(slug) { return read(WISH_KEY, []).includes(slug); }
  function toggleWish(slug) {
    let w = read(WISH_KEY, []);
    const on = !w.includes(slug);
    w = on ? [...w, slug] : w.filter((s) => s !== slug);
    write(WISH_KEY, w);
    updateBadge();
    showToast(on ? 'Guardado en favoritos' : 'Quitado de favoritos');
    return on;
  }

  /* ---------- back to top ---------- */
  topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  window.addEventListener('scroll', () => {
    topBtn.classList.toggle('show', window.scrollY > 900);
  }, { passive: true });

  window.SBStore = { add, isWished, toggleWish, openCart, orders: () => read(ORD_KEY, []) };
})();
