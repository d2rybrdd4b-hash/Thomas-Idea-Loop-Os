const CACHE = 'hsi-v25.06-s';

self.addEventListener('install', () => { self.skipWaiting(); });

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;

  // HTML (navigation): immer frisch vom Netzwerk holen
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }

  // Cross-Origin (CDN-Bibliotheken): nicht abfangen
  if (new URL(req.url).origin !== self.location.origin) return;

  // Gleiche Origin (Icons, Manifest etc.): Cache-first
  e.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (res && res.status === 200) {
          caches.open(CACHE).then(c => c.put(req, res.clone()));
        }
        return res;
      });
    })
  );
});
