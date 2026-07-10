// Gems of Light — service worker.
// Cache-first for the app shell; recitations cache as they are first heard,
// so a surah once played is a surah kept, even offline.
const CACHE = 'gems-of-light-v3';
const SHELL = [
  './', './index.html', './manifest.webmanifest',
  './js/data.js', './js/art.js', './js/props.js', './js/actors.js',
  './js/audio.js', './js/engine.js', './js/levels.js', './js/scenes.js',
  './js/level.js', './js/gate.js', './js/room.js', './js/main.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-180.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  const isAudio = url.pathname.endsWith('.mp3');
  const isFont = url.hostname.includes('fonts.g');
  e.respondWith(
    caches.match(e.request).then((hit) => {
      if (hit) return hit;
      return fetch(e.request)
        .then((res) => {
          const cacheable =
            res && (res.ok || res.type === 'opaque') &&
            (url.origin === location.origin || isAudio || isFont);
          if (cacheable) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => hit);
    })
  );
});
