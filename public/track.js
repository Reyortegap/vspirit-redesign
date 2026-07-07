// SpiritBeach — analítica sin datos personales → backend de la tienda
(function () {
  if (navigator.doNotTrack === '1') return;
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return;

  const TRACK_API = 'https://spiritbeach-store.vercel.app/api/track';
  const send = (type, extra) => {
    try {
      fetch(TRACK_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          type,
          path: location.pathname + location.search,
          referrer: document.referrer || '',
          ...(extra || {}),
        }),
      }).catch(() => {});
    } catch (e) { /* noop */ }
  };

  // página vista
  send('pageview');

  // vista de producto (con el id real del catálogo cuando cargue)
  const slug = location.pathname.replace(/\.html$/, '') === '/producto'
    ? new URLSearchParams(location.search).get('p')
    : null;
  if (slug && window.SBReady) {
    window.SBReady.then(() => {
      const prod = (typeof PRODUCTS !== 'undefined') ? PRODUCTS.find((x) => x.slug === slug) : null;
      send('product_view', prod && prod.id ? { productId: prod.id } : {});
    });
  } else if (slug) {
    send('product_view');
  }

  window.SBTrack = { event: send };
})();
