const CACHE_NAME = 'salonwik-cache-v1';
const staticAssets = [
  './',
  './index.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(staticAssets))
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  if (url.includes("firestore.googleapis.com")) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});