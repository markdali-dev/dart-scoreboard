// Service worker: makes the app work offline.
// Strategy: try the network first (so new versions show up straight away),
// fall back to the saved copy when offline.
// When you add a new file the app needs, add it to FILES and bump VERSION.

const VERSION = 'v1';
const CACHE = `dartscoreboard-${VERSION}`;
const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon.svg',
  './css/theme.css',
  './css/app.css',
  './js/main.js',
  './js/core/dart.js',
  './js/core/registry.js',
  './js/core/engine.js',
  './js/core/theme.js',
  './games/index.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('dartscoreboard-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request, { ignoreSearch: true })),
  );
});
