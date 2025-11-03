const CACHE_NAME = 'vaidarmare-pwa-cache-v5';
// CAMINHOS AJUSTADOS - IMPORTANTE: O Service Worker precisa do caminho completo
// Se sua PWA está em um subdiretório (ex: /vaidarmare/), os caminhos devem refletir isso.
const urlsToCache = [
    '/vaidarmare/',
    '/vaidarmare/index.html',
    '/vaidarmare/manifest.json',
    '/vaidarmare/icon-192x192.png',
    '/vaidarmare/icon-512x512.png'
    // Adicione o caminho do seu GIF aqui se estiver local
    // '/vaidarmare/caminho/do/seu/gif.gif' 
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
  // Estratégia Cache-First para ativos cacheados (Obrigatório para Service Worker básico)
  // **A lógica de fetch não está mais ignorando domínios externos específicos.**
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Retorna do cache se encontrado
        }
        // Tenta buscar da rede se não estiver no cache
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
            // Deleta caches antigos
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
