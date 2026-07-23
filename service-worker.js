

const CACHE_NAME = 'conti-conti-v1';
const urlsToCache = [
    '/',
    'index.html',
    'styles.css',
    'app.js',
    'manifest.json',
    'logo.svg',
    'conejo-uniforme.svg',
    'icono-app.PNG'
];

// Instalar Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache abierto');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.log('Error al cachear:', error);
            })
    );
});

// Activar Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Eliminando cache antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Interceptar peticiones
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Devuelve del cache si existe
                if (response) {
                    return response;
                }
                
                // Si no está en cache, hace la petición a la red
                return fetch(event.request)
                    .then(response => {
                        // Verificar si la respuesta es válida
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clonar la respuesta para guardarla en cache
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(() => {
                        // Si falla la red, intentar devolver una página offline
                        if (event.request.mode === 'navigate') {
                            return caches.match('index.html');
                        }
                    });
            })
    );
});
