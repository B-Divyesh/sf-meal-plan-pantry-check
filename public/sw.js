const VERSION = 'pantry-ledger-v4';
const SHELL = `${VERSION}-shell`;
const RUNTIME = `${VERSION}-runtime`;
const CORE = ['/', '/offline.html', '/manifest.webmanifest', '/icons/icon.svg', '/icons/icon-192.png', '/icons/icon-512.png', '/assets/pantry-ledger-960.avif', '/assets/pantry-ledger-960.webp'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    await cache.addAll(CORE);
    const page = await fetch('/');
    const html = await page.clone().text();
    const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((match) => match[1]);
    await cache.addAll(assets);
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => ![SHELL, RUNTIME].includes(key)).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((response) => {
      const copy = response.clone(); caches.open(RUNTIME).then((cache) => cache.put(request, copy)); return response;
    }).catch(async () => (await caches.match(request)) || (await caches.match('/')) || caches.match('/offline.html')));
    return;
  }
  event.respondWith(caches.match(url.pathname, { ignoreSearch: true }).then((cached) => cached || fetch(request).then((response) => {
    if (response.ok) { const copy = response.clone(); caches.open(RUNTIME).then((cache) => cache.put(request, copy)); }
    return response;
  })));
});
