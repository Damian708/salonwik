const CACHE_NAME = 'salonwik-cache-v1';
const staticAssets = [
  './', // Buforuje katalog główny (np. /)
  './index.html' // Buforuje plik index.html
];

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing and caching static assets.');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(staticAssets);
    }).catch(error => {
      console.error('Service Worker: Cache.addAll failed', error);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Ważne: usuwamy warunek blokujący żądania do firestore.googleapis.com
  // Teraz wszystkie żądania, które nie są w pamięci podręcznej, będą pobierane z sieci.
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Zwróć zasób z pamięci podręcznej, jeśli istnieje
      if (response) {
        // console.log('Service Worker: Serving from cache:', event.request.url);
        return response;
      }
      // Jeśli zasobu nie ma w pamięci podręcznej, spróbuj go pobrać z sieci
      // console.log('Service Worker: Fetching from network:', event.request.url);
      return fetch(event.request).catch(error => {
        console.error('Service Worker: Fetch failed:', event.request.url, error);
        // Możesz tutaj zwrócić stronę awaryjną offline, jeśli chcesz
        // np. return caches.match('/offline.html');
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating. Clearing old caches.');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName.startsWith('salonwik-cache-') && cacheName !== CACHE_NAME;
        }).map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});
