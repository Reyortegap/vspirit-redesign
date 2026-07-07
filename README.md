# SpiritBeach — Tienda

**Producción:** https://vspirit-redesign.vercel.app

Tienda estática (HTML/CSS/JS puro, sin build) de SpiritBeach — beachwear sostenible, Maracaibo.
El catálogo, cupones, pedidos y analítica vienen del backend (`spiritbeach-store`) vía API; si el API no responde, usa el catálogo embebido de respaldo.

## Estructura
- `public/` — todo el sitio (Vercel sirve esta carpeta con `cleanUrls`)
  - `index.html`, `tienda.html`, `bikinis/enterizos/salidas-de-playa.html` (generadas desde tienda), `producto.html?p=slug`, `nosotros`, `contacto`, `404`
  - `styles.css` — design system (tokens de marca: khaki #625e3c, crema #efe7d8, rosa #e0748f; Instrument Serif + Poppins/Montserrat)
  - `products.js` — catálogo: fetch a `https://spiritbeach-store.vercel.app/api/products` (+settings), fallback embebido
  - `store.js` — carrito (localStorage), checkout 2 pasos → WhatsApp + POST `/api/orders`, cupones vía `/api/coupons/validate`
  - `site.js` — menú móvil, reveals, marquee IG (feed en `ig-feed.json`)
  - `track.js` — analítica sin datos personales → POST `/api/track`
  - `water.js` — efecto WebGL de agua (hoy inactivo: el banner usa video `video/flores.mp4`)
  - `logo-*.svg`, `lotus-*.svg` — marca vectorizada
- `admin.html` redirige al panel real: https://spiritbeach-store.vercel.app/admin

## Desarrollo
```bash
cd public && python3 -m http.server 4893   # http://localhost:4893 (usar rutas .html en local)
```

## Deploy
Push a `main` → Vercel despliega solo (proyecto `vspirit-redesign`). Manual: `vercel deploy --prod`.

## Gotchas
- Cache del CSS: al tocar `styles.css`, subir la versión `?v=N` en los `<link>` de todas las páginas.
- Para refrescar el feed de Instagram: regenerar `ig-feed.json` + fotos en `ig/` (endpoint público de IG con header `x-ig-app-id`).
