// Mis Gastos — service worker. Cambia VERSION cada vez que publiques cambios.
const VERSION = 'v1';
const CACHE = 'misgastos-' + VERSION;
const ARCHIVOS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('misgastos-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Responde desde caché al instante (funciona sin internet) y, si hay señal,
// actualiza la caché en segundo plano para la próxima vez que se abra.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const enCache = await cache.match(req, {ignoreSearch: true})
      || (req.mode === 'navigate' ? await cache.match('./index.html') : undefined);
    const red = fetch(req).then(res => { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
    if (enCache) { e.waitUntil(red); return enCache; }
    const res = await red;
    return res || new Response('Sin conexión', {status: 503, headers: {'Content-Type': 'text/plain; charset=utf-8'}});
  }));
});
