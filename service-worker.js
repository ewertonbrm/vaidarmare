// A versão do cache é CRÍTICA. Mude este número sempre que alterar qualquer arquivo estático (HTML, CSS, JS, Imagens, JSON de dados).
const CACHE_NAME = 'vaidarmare-v1.0.4'; 

// Lista de URLs para cachear no momento da instalação (App Shell)
const urlsToCache = [
    '/', // Representa index.html na raiz
    'index.html',
    'manifest.json',
    
    // Lista de ativos (Ajuste os nomes dos seus ícones se necessário)
    'icon-192x192.png', 
    'icon-512x512.png', 
];

// --- Etapa 1: Instalação e Cache do App Shell ---
self.addEventListener('install', (event) => {
    // Força o service worker a se ativar imediatamente após a instalação
    self.skipWaiting(); 
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Cacheando App Shell.');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('Service Worker: Falha ao cachear arquivos:', error);
            })
    );
});

// --- Etapa 2: Limpeza de Caches Antigos ---
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Exclui todos os caches que não correspondem à CACHE_NAME atual
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deletando cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Assegura que o Service Worker assume o controle dos clientes imediatamente
    return self.clients.claim();
});

// --- Etapa 3: Estratégia de Cache (Cache-First para App Shell) ---
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Ignora requisições de outras origens (CDNs de fonte, Tailwind)
    if (url.origin !== location.origin) {
        return;
    }

    // Estratégia Cache-First: Tenta buscar no cache, se falhar, vai para a rede.
    event.respondWith(
        caches.match(event.request).then((response) => {
            // Retorna o item em cache, se encontrado
            if (response) {
                return response;
            }
            
            // Caso contrário, busca na rede
            return fetch(event.request).catch(() => {
                // Se tudo falhar, podemos retornar o index.html em cache como fallback
                return caches.match('index.html'); 
            });
        })
    );
});
