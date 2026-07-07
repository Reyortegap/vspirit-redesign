// SpiritBeach — shared behavior
(function () {
  // scroll reveal
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.rv').forEach((el) => io.observe(el));

  // mobile menu
  const btn = document.querySelector('.menu-btn');
  const menu = document.querySelector('.mobile-menu');
  if (btn && menu) btn.addEventListener('click', () => menu.classList.toggle('open'));

  // instagram feed — marquee infinito, se pausa al hacer hover
  const track = document.querySelector('.ig-track');
  if (track) {
    fetch('/ig-feed.json')
      .then((r) => r.json())
      .then((posts) => {
        track.textContent = '';
        const valid = posts.filter((p) => /^https:\/\/(www\.)?instagram\.com\//.test(p.link) && /^\/ig\//.test(p.img));
        const makeTile = (p, hidden) => {
          const a = document.createElement('a');
          a.className = 'ig-tile';
          a.href = p.link;
          a.target = '_blank';
          a.rel = 'noopener';
          a.setAttribute('aria-label', 'Ver post en Instagram');
          if (hidden) a.setAttribute('aria-hidden', 'true'); // copia para el loop
          const img = document.createElement('img');
          img.src = p.img;
          img.alt = hidden ? '' : (p.caption || 'Post de @vspiritbeach');
          img.loading = 'lazy';
          a.appendChild(img);
          a.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1"/></svg>');
          return a;
        };
        valid.forEach((p) => track.appendChild(makeTile(p, false)));
        valid.forEach((p) => track.appendChild(makeTile(p, true))); // duplicado = scroll sin costura
      })
      .catch(() => { track.closest('section')?.classList.add('ig-error'); });
  }
})();
