const CACHE_NAME = 'vaidarmare-pwa-static-v4'; // Cache para arquivos estáticos (shell)
const API_CACHE_NAME = 'vaidarmare-pwa-api-v1'; // Cache para dados da API de marés

// Arquivos essenciais para a "casca" do PWA (Static assets)
const urlsToCache = [
    '/', 
    '/index.html',
    '/manifest.json',
    '/icon-192x192.png', 
    '/icon-512x512.png',
    // URLs de recursos externos estáticos para garantir que o layout carregue
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Oswald:wght@200..700&display=swap',
    'https://fonts.googleapis.com/css2?family=Playwrite+DE+SAS:wght@100..400&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW: Cache estático aberto.');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('SW: Falha ao adicionar arquivos estáticos ao cache:', err);
      })
  );
});

self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);

    // ESTRATÉGIA 1: CACHE-FIRST para a API de Marés (/api/tide)
    if (requestUrl.pathname.includes('/api/tide')) {
        event.respondWith(
            caches.open(API_CACHE_NAME).then(cache => {
                return cache.match(event.request).then(response => {
                    // 1. Tenta Cache
                    if (response) {
                        console.log('SW: API encontrada no cache:', requestUrl.pathname);
                        return response;
                    }
                    
                    // 2. Se não estiver no cache, vai para a Rede
                    console.log('SW: Buscando API na rede:', requestUrl.pathname);
                    return fetch(event.request).then(networkResponse => {
                        // Verifica se a resposta é válida antes de cachear
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }
                        
                        // 3. Clona e armazena no cache antes de retornar
                        const responseToCache = networkResponse.clone();
                        cache.put(event.request, responseToCache);
                        return networkResponse;
                    }).catch(error => {
                        // 4. Falha na Rede (Usuário Offline ou sem conexão)
                        console.error('SW: Falha na requisição de API (Rede falhou):', error);
                        // Retorna uma resposta de erro que o JS do index.html tratará.
                        return new Response(JSON.stringify({ code: 'OFFLINE_ERROR', msg: 'Sem conexão de rede. Os dados só podem ser buscados se houver internet.' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
                    });
                });
            })
        );
        return; 
    }

    // ESTRATÉGIA 2: CACHE-FIRST para a Casca Estática (STATIC ASSETS)
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
  const cacheWhitelist = [CACHE_NAME, API_CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Deleta caches antigos que não estão na whitelist
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('SW: Deletando cache antigo', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
