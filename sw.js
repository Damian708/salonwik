const CACHE_NAME = 'salonwik-cache-v1';
const staticAssets = [
  './',
  './index.html',
  './manifest.json',
  './icon-128x128.png',
  './icon-144x144.png',
  './icon-152x152.png',
  './icon-180x180.png',
  './icon-256x256.png',
  './icon-384x384.png',
  './icon-512x512.png',
  './icon-48x48.png',
  './icon-72x72.png',
  './icon-96x96.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(staticAssets))
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Nie przechwytuj zapytań do Firestore
  if (url.includes("firestore.googleapis.com")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});