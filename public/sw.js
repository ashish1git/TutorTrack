// This is a minimal Service Worker required for the "Add to Home Screen" prompt
self.addEventListener('install', (e) => {
  console.log('[Service Worker] Install');
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  console.log('[Service Worker] Activate');
});

self.addEventListener('fetch', (e) => {
  // Basic pass-through to ensure the app works online
  e.respondWith(fetch(e.request));
});