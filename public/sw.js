// Service Worker for Klanginsel Music Player
// Enables background audio playback

const CACHE_NAME = 'klanginsel-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/App.css',
  '/src/index.css',
  '/favicon.svg',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install event - cache essential files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network first, then cache
self.addEventListener('fetch', event => {
  // Special handling for SoundCloud resources to ensure they're not cached
  if (event.request.url.includes('soundcloud.com') || 
      event.request.url.includes('sndcdn.com')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Listen for messages from the client
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'KEEP_ALIVE') {
    // Keep service worker active to maintain background audio
    console.log('Keeping service worker alive for background audio');
  }
});

// Handle audio focus for background playback
self.addEventListener('audioprocess', () => {
  // This helps maintain audio processing in the background
  console.log('Audio processing event');
});