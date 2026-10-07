const CACHE_NAME = 'theharvest7-cache-v25';
const ASSETS = [
  './',
  './index.html',
  './mobile_entry.html',
  './todo_v2.html',
  './styles.css',
  './todo_v2.css',
  './app.js',
  './desktop_entry.js',
  './todo_v2.js',
  './formulas.js',
  './flower_cycles_db.js',
  './chatbot.js',
  './investment.js',
  './config.js',
  './manifest.json',
  './assets/favicon.png',
  './assets/favicon.ico',
  './assets/leaf_icon.png',
  './assets/Buffet1.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/apple-touch-icon.png',
  './assets/background.jpg',
  './assets/bamboo_growth.png'
];

// Install Event
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Cache files individually to prevent one failure from blocking all
        return Promise.all(
          ASSETS.map((asset) => {
            return cache.add(asset).catch((err) => {
              console.warn(`[Service Worker] Failed to cache: ${asset}`, err);
            });
          })
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event (Network-First Strategy)
self.addEventListener('fetch', (e) => {
  // Only handle GET requests
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request).catch(() => {
      return caches.match(e.request);
    })
  );
});
