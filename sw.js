// Service worker: uso offline e instalação como aplicativo (PWA).
// O app e as bibliotecas (pasta vendor/: 3D, PDF e DWG) ficam guardados no navegador
// depois do primeiro acesso, então tudo funciona sem internet.
const CACHE = 'vorticis-arch-1.0.0'; // mude junto com APP_VERSION a cada versão
const CORE = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icons/icon-192.png', './icons/icon-512.png',
  './css/app.css', './js/core.js', './js/tools.js', './js/elements.js', './js/smart.js', './js/convert.js', './js/ui.js', './js/photo.js',
  './js/io.js', './js/import.js', './js/export.js', './js/view3d-fallback.js', './js/view3d.js', './js/app.js'];
const VENDOR = ['./vendor/three/build/three.module.js', './vendor/three/build/three.core.js', './vendor/three/examples/jsm/controls/OrbitControls.js',
  './vendor/pdfjs/build/pdf.min.mjs', './vendor/pdfjs/build/pdf.worker.min.mjs',
  './vendor/libredwg-web/dist/libredwg-web.js', './vendor/libredwg-web/wasm/libredwg-web.js', './vendor/libredwg-web/wasm/libredwg-web.wasm'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const ks = await caches.keys();
    await Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
    // bibliotecas (~15 MB) em segundo plano; falhas não impedem o app de funcionar
    const c = await caches.open(CACHE);
    for (const u of VENDOR) { try { if (!(await c.match(u))) await c.add(u); } catch (err) { /* tenta de novo na próxima visita */ } }
  })());
});
// Rede primeiro (pega atualizações); cache como reserva offline.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (u.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(ca => ca.put(e.request, c)); } return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || (e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
  );
});
