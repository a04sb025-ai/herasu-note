const CACHE_NAME = 'herasu-note-v3';
const BASE_URL = self.registration.scope;
const appUrl = (path) => new URL(path, BASE_URL).href;
const APP_SHELL = [
  appUrl('./'),
  appUrl('index.html'),
  appUrl('src/main.js'),
  appUrl('src/styles.css'),
  appUrl('manifest.webmanifest'),
  appUrl('icons/icon-192.svg'),
  appUrl('icons/icon-512.svg'),
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(appUrl('index.html')));
    }),
  );
});
