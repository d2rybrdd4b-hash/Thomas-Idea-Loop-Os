const CACHE = 'hsi-v25.06-ai';

// Kern-Dateien, die beim Installieren VORGELADEN werden — damit die App auch ohne
// Internet vollständig läuft (inkl. Excel-Lesen/Schreiben über die lokalen Bibliotheken).
const PRECACHE = [
  './',
  'standalone.html',
  'lib/xlsx.full.min.js',
  'lib/exceljs.min.js',
  'manifest.json',
  'icon-180.png',
  'icon-192.png',
  'icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      // Jede Datei einzeln cachen — eine fehlende Datei bricht die Installation nicht ab.
      Promise.allSettled(PRECACHE.map(u => c.add(new Request(u, { cache: 'reload' }))))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // HTML (Navigation): network-first (immer neueste Version), bei Offline aus dem Cache
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req).then(m => m || caches.match('standalone.html')))
    );
    return;
  }

  // Cross-Origin: nicht abfangen
  if (new URL(req.url).origin !== self.location.origin) return;

  // Gleiche Origin (lokale Bibliotheken, Icons, Manifest): Cache-first, sonst Netzwerk + cachen
  e.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      });
    })
  );
});
