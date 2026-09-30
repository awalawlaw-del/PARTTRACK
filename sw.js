// PartTrack service worker (versi dasar untuk PWA)
// Strategi: jaringan dulu, cache hanya sebagai cadangan saat offline.
// Data Supabase / CDN (beda domain) tidak pernah di-cache, jadi data selalu segar.
const CACHE = 'parttrack-v1';
const ASET = ['./', './index.html', './manifest.json', './logo.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASET)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase & CDN langsung ke jaringan

  e.respondWith(
    fetch(req)
      .then((res) => {
        const salinan = res.clone();
        caches.open(CACHE).then((c) => c.put(req, salinan)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
  );
});
