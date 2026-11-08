// Offline support: serve the page from cache, refresh it in the background.
// Calls to Google (the Apps Script API) are never cached.
const CACHE = 'danang-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const host = new URL(req.url).hostname;
  if (host.endsWith('google.com') || host.endsWith('googleusercontent.com')) return;

  e.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(req);
    const network = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) { try { cache.put(req, res.clone()); } catch (err) {} }
      return res;
    }).catch(() => cached);
    return cached || network;
  }));
});
