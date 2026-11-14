// Service worker: uso offline e instalação como aplicativo (PWA).
const CACHE = 'vorticis-arch-v2';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icons/icon-192.png', './icons/icon-512.png',
  './css/app.css', './js/core.js', './js/elements.js', './js/tools.js', './js/smart.js', './js/ui.js', './js/photo.js',
  './js/io.js', './js/import.js', './js/export.js', './js/view3d-fallback.js', './js/view3d.js', './js/app.js'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Rede primeiro (pega atualizações); cache como reserva offline. Bibliotecas da CDN (3D, DWG, PDF) também ficam em cache após o primeiro uso.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (u.origin !== location.origin && u.hostname !== 'cdn.jsdelivr.net') return;
  e.respondWith(
    fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(ca => ca.put(e.request, c)); } return r; })
      .catch(() => caches.match(e.request).then(r => r || (u.origin === location.origin ? caches.match('./index.html') : Response.error())))
  );
});
