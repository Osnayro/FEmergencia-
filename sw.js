

// Nombre de la caché (cambia la versión si realizas cambios futuros)
const CACHE_NAME = 'conti-conti-v2';

// Archivos locales (críticos - si alguno falla, la instalación se cancela)
const LOCAL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './conejo-uniforme.PNG',
  './logo-colegio.jpg',
  './icono-app.PNG'
];

// Archivos externos (no críticos - si fallan, no rompen la instalación)
const EXTERNAL_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap',
  'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js'
];

// 1. EVENTO DE INSTALACIÓN
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Archivos locales: SIEMPRE deben cachearse
      try {
        await cache.addAll(LOCAL_ASSETS);
        console.log('[Service Worker] Archivos locales cacheados correctamente');
      } catch (error) {
        console.error('[Service Worker] Error cacheando archivos locales:', error);
      }

      // Archivos externos: no rompen la instalación si fallan
      console.log('[Service Worker] Intentando cachear archivos externos...');
      await Promise.allSettled(
        EXTERNAL_ASSETS.map(url =>
          cache.add(url).catch(err =>
            console.warn(`[Service Worker] No se pudo cachear: ${url}`, err)
          )
        )
      );

      return self.skipWaiting();
    })
  );
});

// 2. EVENTO DE ACTIVACIÓN: Limpia versiones antiguas de la caché
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activando...');
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

// 3. EVENTO DE INTERCEPTACIÓN (FETCH)
self.addEventListener('fetch', (event) => {
  // No interceptar solicitudes a extensiones de Chrome ni esquemas no soportados
  if (event.request.url.startsWith('chrome-extension://') || 
      !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Si está en caché, lo entrega inmediatamente
        if (response) {
          return response;
        }

        // Si no está en caché, lo busca en internet
        return fetch(event.request)
          .then((networkResponse) => {
            // Guardar en caché para uso futuro
            if (event.request.method === 'GET' && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Si no hay internet y busca la página principal, devuelve index.html
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
            return new Response('Recurso no disponible offline', { status: 503 });
          });
      })
  );
});

