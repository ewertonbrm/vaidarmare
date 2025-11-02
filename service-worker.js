// A versão do cache é CRÍTICA. Mude este número sempre que alterar qualquer arquivo estático (HTML, CSS, JS, Imagens, JSON de dados).
const CACHE_NAME = 'vaidarmare-v1.0.3'; 

// Lista de URLs para cachear no momento da instalação (App Shell)
// Agora inclui o JSON de dados e ícones que o PWA precisa.
const urlsToCache = [
    '/', // Representa index.html
    'index.html',
    'manifest.json',
    // O service-worker se registra, mas não se cacheia
    
    // ATIVOS
    // Assumindo que você tem os ícones necessários no root:
    'icon-192x192.png', // Exemplo de ícone, ajuste se os nomes forem diferentes
    'icon-512x512.png', // Exemplo de ícone, ajuste se os nomes forem diferentes
    
    // FONTE: Oswald e Playwrite são carregadas via CDN, mas mantemos o index.html na lista.
    
    // DADOS: Agora os dados estão embutidos no index.html, então não precisamos cachear um arquivo de dados externo!
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
    
    // Ignora requisições de outras origens (como Google Fonts CDN)
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
                // Opcional: Aqui você pode retornar uma página offline customizada
                console.error('Falha na busca e cache:', event.request.url);
            });
        })
    );
});
