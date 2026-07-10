// Gems of Light — service worker.
// Cache-first for the app shell; recitations cache as they are first heard,
// so a surah once played is a surah kept, even offline.
const CACHE = 'gems-of-light-v2-r9'; // bumped: Open Graph / iMessage preview image on index.html + kawthar.html
const SHELL = [
  './', './index.html', './manifest.webmanifest',
  './js/data.js', './js/art.js', './js/props.js', './js/actors.js',
  './js/audio.js', './js/engine.js', './js/levels.js', './js/scenes.js',
  './js/level.js', './js/gate.js', './js/room.js', './js/main.js',
  './assets/key-art.jpg',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-180.png',
  // the painterly Al-Kawthar slice, installable on its own
  './kawthar.html', './js/kawthar.js', './manifest-kawthar.webmanifest',
  './assets/paint/proc/bg-far.png', './assets/paint/proc/bg-mid.png',
  './assets/paint/proc/wall.png', './assets/paint/proc/ground-fill.png',
  './assets/paint/proc/platform.png', './assets/paint/proc/tree-olive.png',
  './assets/paint/proc/plant-0.png', './assets/paint/proc/plant-1.png',
  './assets/paint/proc/plant-2.png', './assets/paint/proc/grass-fringe.png',
  './assets/paint/proc/gem-1.png', './assets/paint/proc/gem-2.png',
  './assets/paint/proc/gem-3.png', './assets/paint/proc/arch.png',
  './assets/paint/proc/spring.png',
  './assets/paint/proc/ll-idle.png', './assets/paint/proc/ll-walk-a.png',
  './assets/paint/proc/ll-walk-b.png', './assets/paint/proc/ll-jump.png',
  './assets/paint/proc/ll-collect.png'
];

self.addEventListener('install', (e) => {
  // caches.addAll() is all-or-nothing: one flaky fetch (a slow cellular
  // connection, a single dropped request among ~30 files) fails the WHOLE
  // install, and the browser just keeps running whatever old worker it
  // already had — silently, with no error surfaced anywhere. That's how a
  // phone can get stuck several versions behind forever. Cache each file
  // independently instead, so one miss doesn't cost every future update.
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      Promise.all(SHELL.map((url) => c.add(url).catch((err) => {
        console.warn('[sw] precache miss, continuing:', url, err);
      })))
    ).then(() => self.skipWaiting())
  );
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
