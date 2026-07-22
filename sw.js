// Nombre de la caché (puedes cambiar la versión v1 -> v2 si realizas cambios futuros)
const CACHE_NAME = 'conti-conti-v1';

// Lista de archivos necesarios para que la PWA funcione 100% offline
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './conejo-uniforme.PNG',
  './logo-colegio.jpg',
  './icono-app.PNG',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap',
  'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js'
];

// 1. EVENTO DE INSTALACIÓN: Guarda los archivos en la caché local
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Guardando archivos en la caché...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// 2. EVENTO DE ACTIVACIÓN: Limpia versiones antiguas de la caché si actualizas el juego
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Borrando caché antigua:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. EVENTO DE INTERCEPTACIÓN (FETCH): Sirve el contenido desde la caché si está offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Si el archivo está en caché, lo entrega inmediatamente
        if (response) {
          return response;
        }
        // Si no está en caché, lo busca en internet
        return fetch(event.request).catch(() => {
          // Si no hay internet y busca la página principal, devuelve index.html de la caché
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
