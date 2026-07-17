// Gems of Light — service worker (v3 at the root as of 2026-07-12).
// NETWORK-FIRST for everything same-origin: the game iterates fast, and a
// stale shell is worse than a moment of loading. Every successful fetch is
// kept, so once a page or script has been seen it works offline.
// CACHE-FIRST for recitations (.mp3) and fonts: immutable once heard —
// a surah once played is a surah kept, even offline.
// The /v1/ archive and /v2/ lab ride the same rules.
const CACHE = 'gems-of-light-v39';
const SHELL = [
  './', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-180.png'
];

self.addEventListener('install', (e) => {
  // cache:'reload' bypasses the HTTP cache — the shell precache must never
  // capture a stale copy the browser was holding onto
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const isAudio = url.pathname.endsWith('.mp3');
  const isFont = url.hostname.includes('fonts.g');

  // recitations + fonts: cache-first (immutable), fill the cache on first hear
  if (isAudio || isFont) {
    e.respondWith(
      caches.match(e.request, { ignoreSearch: true }).then((hit) => {
        if (hit) return hit;
        return fetch(e.request).then((res) => {
          if (res && (res.ok || res.type === 'opaque')) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        });
      })
    );
    return;
  }

  // everything else same-origin: network-first, cached copy as the fallback.
  // Navigations (the HTML itself) revalidate past the HTTP cache so a deploy
  // is visible on the very next open, not after a heuristic-cache TTL.
  if (url.origin === location.origin) {
    const req = e.request.mode === 'navigate'
      ? new Request(e.request.url, { cache: 'no-cache' })
      : e.request;
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => caches.match(e.request, { ignoreSearch: true }))
    );
  }
});
