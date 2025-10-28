
const CACHE_NAME = 'vaidarmare-pwa-cache-v3';
// Arquivos essenciais para a "casca" do PWA
const urlsToCache = [
    '/', // O Vercel serve o index.html a partir da raiz
    '/index.html',
    '/manifest.json',
    '/vaida192.png', // Sua imagem de logo deve estar na raiz
    '/icon-192x192.png', // Caminhos corrigidos
    '/icon-512x512.png'  // Caminhos corrigidos
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Arquivos em cache durante a instalação');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Falha ao adicionar arquivos ao cache:', err);
      })
  );
});

self.addEventListener('fetch', event => {
    // Se a requisição for para a API, use apenas a rede (network-only)
    // A chamada da API é /api/tide, que é o nosso proxy. Não deve ser cacheada.
    if (event.request.url.includes('/api/tide')) {
        return; // Deixa o fetch normal da rede acontecer
    }

    // Para todos os outros arquivos (a casca do app), use Cache-First
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Retorna o arquivo do cache, se existir
                if (response) {
                    return response;
                }
                // Caso contrário, busca na rede
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
            console.log('Service Worker: Deletando cache antigo', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

