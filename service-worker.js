const CACHE_NAME = 'vaidarmare-pwa-cache-v9';
// URLs ajustadas para o subdiretório /vaidarmare/ para consistência
const urlsToCache = [
    '/vaidarmare/', // Representa index.html quando a start_url é resolvida para o diretório
    '/vaidarmare/index.html',
    '/vaidarmare/manifest.json',
    '/vaidarmare/icon-192x192.png',
    '/vaidarmare/icon-512x512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Arquivos em cache durante a instalação');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  // Ignora requisições para o site externo (https://androidauthority.com)
  if (!event.request.url.includes(self.location.origin)) {
      return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

});
