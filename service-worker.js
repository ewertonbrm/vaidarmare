const CACHE_NAME = 'vaidarmare-pwa-cache-v5';
// CAMINHOS AJUSTADOS
const urlsToCache = [
    '/vaidarmare/',
    '/vaidarmare/index.html',
    '/vaidarmare/manifest.json',
    '/vaidarmare/icon-192x192.png',
    '/vaidarmare/icon-512x512.png'
    // Adicione o caminho do seu GIF aqui se estiver local
    // '/insta/caminho/do/seu/gif.gif' 
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
