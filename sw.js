const CACHE_NAME = 'aether-scribe-v1';
const CDN_CACHE = 'aether-scribe-cdn-v1';
const APP_SHELL = [
    './index.html',
    './css/styles.css',
    './js/app.js',
    './js/ui.js',
    './js/conversation.js',
    './js/speech.js',
    './js/config.js',
    './js/preferences.js',
    './js/medicalScribePromptBuilder.js',
    './js/scribeNoteManager.js',
    './js/templates.js',
    './js/webgpu-check.js',
    './js/asyncStorage.js',
    './images/logo.png',
    './images/icon.png',
    './images/favicon.ico',
    './assets/icon-192.png',
    './assets/icon-512.png'
];

// CDN resources to cache (network-first strategy)
const CDN_ORIGINS = [
    'cdn.jsdelivr.net',
    'cdnjs.cloudflare.com',
    'esm.run',
    'fonts.googleapis.com',
    'fonts.gstatic.com'
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(APP_SHELL);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => {
                        // Only delete old versions of OUR specific caches
                        const isOldAppCache = name.startsWith('soltura-') && name !== CACHE_NAME && name !== CDN_CACHE;
                        const isOldAetherCache = name.startsWith('aether-') && name !== CACHE_NAME;
                        return isOldAppCache || isOldAetherCache;
                    })
                    .map((name) => {
                        console.log('[Service Worker] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    const isCDN = CDN_ORIGINS.some(origin => url.hostname.includes(origin));

    // CDN resources: Network-first, fallback to cache
    if (isCDN) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Cache successful CDN responses
                    if (response && response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(CDN_CACHE).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if network fails
                    return caches.match(event.request);
                })
        );
        return;
    }

    // Skip other cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    // App resources: Cache-first, fallback to network
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }

                // Clone the request
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then((response) => {
                    // Check if valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response
                    const responseToCache = response.clone();

                    // Cache the new resource
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                });
            })
    );
});
