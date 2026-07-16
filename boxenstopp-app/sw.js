const CACHE = 'boxenstopp-v1';
const SHELL = [
  './standalone.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  const isHtml = e.request.mode === 'navigate' || url.includes('standalone.html') || url.endsWith('/');
  if (url.includes('supabase.co')) {
    // Supabase-Anfragen NICHT abfangen — nativ durchreichen (Login, Buchungen, Reset)
    return;
  } else if (isHtml) {
    // Network-first für die App-HTML, damit Updates ohne Hänger ankommen
    e.respondWith(
      fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() =>
        caches.match(e.request).then(r => r || new Response('<h1>Offline</h1><p>Bitte Internetverbindung pr\u00fcfen.</p>', { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }))
      )
    );
  } else {
    // Cache-first für statische Assets (Icons, Manifest)
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(res => {
        if (res && res.status === 200 && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }))
    );
  }
});
