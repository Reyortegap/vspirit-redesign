// SpiritBeach — catálogo + configuración compartida
const CONFIG = {
  tasaBs: 166.0,          // tasa Bs/$ por defecto (editable en /admin)
  whatsapp: '584246535755',
};

// cupones válidos para TODOS los clientes (el admin puede sumar locales)
const COUPONS = { 'SPIRIT10': 10, 'VERANO15': 15 };

const PRODUCTS = [
  { slug: 'caracoles',                name: 'Caracoles',                     price: 45, colors: 'Rosa · Coral',           cat: 'bikinis',   badge: 'Destacado', sizes: ['S', 'M'] },
  { slug: 'caracoles-enterizo',       name: 'Caracoles Enterizo',            price: 50, colors: 'Rosa · Coral',           cat: 'enterizos', badge: null,        sizes: ['S', 'M'] },
  { slug: 'golden',                   name: 'Golden',                        price: 50, colors: 'Dorado · Plata',         cat: 'bikinis',   badge: 'Destacado', sizes: ['S', 'M'] },
  { slug: 'palmera-naranja',          name: 'Palmera Naranja',               price: 45, colors: 'Naranja · Coral',        cat: 'bikinis',   badge: null,        sizes: ['M', 'L'] },
  { slug: 'palmera-naranja-enterizo', name: 'Palmera Naranja Enterizo',      price: 50, colors: 'Naranja · Coral',        cat: 'enterizos', badge: null,        sizes: ['M', 'L'] },
  { slug: 'marea',                    name: 'Marea',                         price: 45, colors: 'Azul mar · Denim',       cat: 'bikinis',   badge: 'Nuevo',     sizes: ['S', 'M'] },
  { slug: 'palmera-negra',            name: 'Palmera Negra',                 price: 45, colors: 'Negro · Verde · Morado', cat: 'bikinis',   badge: 'Nuevo',     sizes: ['S', 'M'] },
  { slug: 'palmera-negra-enterizo',   name: 'Palmera Negra Enterizo',        price: 50, colors: 'Negro · Verde · Azul',   cat: 'enterizos', badge: null,        sizes: ['S', 'M'] },
  { slug: 'palmera-negra-cruzada',    name: 'Palmera Negra Espalda Cruzada', price: 50, colors: 'Negro · Morado · Azul',  cat: 'enterizos', badge: null,        sizes: ['S', 'M'] },
  { slug: 'pina',                     name: 'Piña',                          price: 50, colors: 'Verde · Naranja',        cat: 'enterizos', badge: null,        sizes: ['S', 'M'] },
  { slug: 'denim',                    name: 'Denim',                         price: 45, colors: 'Denim · Beige',          cat: 'bikinis',   badge: null,        sizes: ['S', 'M'] },
  { slug: 'malla-marron',             name: 'Malla Marrón',                  price: 45, colors: 'Marrón · Nude',          cat: 'salidas',   badge: null,        sizes: ['Única'] },
];

const CAT_LABELS = { todo: 'Todo', bikinis: 'Bikinis', enterizos: 'Enterizos', salidas: 'Salidas de playa' };
const WA = 'https://wa.me/' + CONFIG.whatsapp;

/* ---------- catálogo VIVO desde el backend (admin conectado) ---------- */
const API = 'https://spiritbeach-store.vercel.app';
function readJSON(key, fb) { try { return JSON.parse(localStorage.getItem(key)) ?? fb; } catch (e) { return fb; } }

window.SB_LIVE = false;
window.SBReady = (async () => {
  try {
    const [pr, sr] = await Promise.all([
      fetch(API + '/api/products').then((r) => r.json()),
      fetch(API + '/api/settings').then((r) => r.json()).catch(() => null),
    ]);
    if (pr && pr.ok && Array.isArray(pr.products) && pr.products.length) {
      const now = new Date();
      const mapped = pr.products
        .filter((p) => p.active)
        .map((p) => {
          const onSale = p.salePrice && (!p.saleEndsAt || new Date(p.saleEndsAt) > now);
          return {
            id: p.id,
            slug: p.slug,
            name: p.name,
            price: onSale ? p.salePrice : p.price,
            basePrice: p.price,
            colors: ((p.description || '').split('.')[0] || '').trim(),
            desc: p.description || '',
            cat: p.category && p.category.slug === 'salidas-de-playa' ? 'salidas' : ((p.category && p.category.slug) || 'bikinis'),
            badge: p.featured ? 'Destacado' : (p.isNew ? 'Nuevo' : null),
            sizes: (p.sizes || 'S,M').split(',').map((s) => s.trim()).filter(Boolean),
            image: p.image || ('/products/' + p.slug + '.jpg'),
          };
        });
      PRODUCTS.length = 0;
      PRODUCTS.push(...mapped);
      window.SB_LIVE = true;
    }
    if (sr && sr.ok && sr.settings) window.SB_SETTINGS = sr.settings;
  } catch (e) { /* sin conexión: catálogo embebido de respaldo */ }
})();

function getTasa() {
  const s = window.SB_SETTINGS;
  if (s && s.bcvRate > 0) return s.bcvRate;
  const t = parseFloat(localStorage.getItem('sb-tasa'));
  return (t && t > 0) ? t : CONFIG.tasaBs;
}
function getCoupons() {
  return { ...COUPONS, ...readJSON('sb-coupons', {}) };
}
function activeProducts() {
  return PRODUCTS.filter((p) => p.active !== false);
}

/* ---------- cards ---------- */
// revelado escalonado de las cards al entrar en pantalla
const cardObserver = ('IntersectionObserver' in window)
  ? new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const i = el.parentElement ? [...el.parentElement.children].indexOf(el) : 0;
        el.style.transitionDelay = (Math.min(i % 8, 6) * 70) + 'ms';
        el.classList.add('in');
        cardObserver.unobserve(el);
      });
    }, { threshold: 0.08 })
  : null;

function productCard(p) {
  const card = document.createElement('a');
  card.className = 'prod rv';
  card.href = '/producto?p=' + p.slug;
  if (cardObserver) queueMicrotask(() => cardObserver.observe(card));
  else card.classList.add('in');

  if (p.badge) {
    const b = document.createElement('span');
    b.className = 'prod-badge' + (p.badge === 'Nuevo' ? ' nuevo' : '');
    b.textContent = p.badge;
    card.appendChild(b);
  }

  const buy = document.createElement('button');
  buy.className = 'buy';
  buy.setAttribute('aria-label', 'Añadir ' + p.name + ' al carrito');
  buy.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6"><path d="M6 8h12l-1 13H7L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>');
  buy.addEventListener('click', (e) => {
    e.preventDefault(); e.stopPropagation();
    if (window.SBStore) window.SBStore.add(p.slug, p.sizes[0], 1);
  });
  card.appendChild(buy);

  const wish = document.createElement('button');
  wish.className = 'wish';
  wish.setAttribute('aria-label', 'Guardar ' + p.name + ' en favoritos');
  wish.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.9-9.7-9.2C.8 8.6 2.6 5 6.1 5c2.1 0 3.4 1.1 4.2 2.3.4.6 1 .6 1.4 0C12.5 6.1 13.8 5 15.9 5c3.5 0 5.3 3.6 3.8 6.8C17.5 16.1 12 21 12 21z"/></svg>');
  if (window.SBStore && window.SBStore.isWished(p.slug)) wish.classList.add('on');
  wish.addEventListener('click', (e) => {
    e.preventDefault(); e.stopPropagation();
    if (window.SBStore) wish.classList.toggle('on', window.SBStore.toggleWish(p.slug));
  });
  card.appendChild(wish);

  const ph = document.createElement('div');
  ph.className = 'ph';
  const img = document.createElement('img');
  img.src = p.image || ('/products/' + p.slug + '.jpg');
  img.alt = p.name + ' — ' + p.colors;
  img.loading = 'lazy';
  img.decoding = 'async';
  ph.appendChild(img);
  card.appendChild(ph);

  const info = document.createElement('div');
  info.className = 'prod-info';
  const nm = document.createElement('span'); nm.className = 'prod-name'; nm.textContent = p.name;
  const pr = document.createElement('span'); pr.className = 'prod-price'; pr.textContent = '$' + p.price.toFixed(2);
  info.append(nm, pr);
  card.appendChild(info);

  const col = document.createElement('div');
  col.className = 'prod-colors';
  col.textContent = p.colors;
  card.appendChild(col);
  return card;
}

function renderShop() {
  const grid = document.getElementById('shop-grid');
  if (!grid) return;
  const fixedCat = grid.dataset.cat || null;
  let current = fixedCat || 'todo';
  let query = '';
  let sort = 'recomendado';

  const draw = () => {
    let items = activeProducts().filter((p) => current === 'todo' || p.cat === current);
    if (query) items = items.filter((p) => (p.name + ' ' + p.colors).toLowerCase().includes(query));
    if (sort === 'precio-asc') items = [...items].sort((a, b) => a.price - b.price);
    if (sort === 'precio-desc') items = [...items].sort((a, b) => b.price - a.price);
    grid.textContent = '';
    items.forEach((p) => grid.appendChild(productCard(p)));
    const count = document.getElementById('shop-count');
    if (count) count.textContent = items.length + (items.length === 1 ? ' producto' : ' productos');
  };

  const bar = document.getElementById('shop-filters');
  if (bar && !fixedCat) {
    Object.entries(CAT_LABELS).forEach(([key, label]) => {
      const c = document.createElement('button');
      c.className = 'chip' + (key === current ? ' active' : '');
      c.textContent = label;
      c.addEventListener('click', () => {
        current = key;
        bar.querySelectorAll('.chip').forEach((x) => x.classList.remove('active'));
        c.classList.add('active');
        draw();
      });
      bar.appendChild(c);
    });
  }

  const search = document.getElementById('shop-search');
  if (search) search.addEventListener('input', () => { query = search.value.trim().toLowerCase(); draw(); });
  const sortSel = document.getElementById('shop-sort');
  if (sortSel) sortSel.addEventListener('change', () => { sort = sortSel.value; draw(); });

  draw();
}
document.addEventListener('DOMContentLoaded', async () => {
  if (window.SBReady) await window.SBReady;
  renderShop();
});
