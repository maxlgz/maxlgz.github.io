// Étude — Service Worker
// Cache-first sur les statiques de l'app (HTML/CSS/JS/icônes/manifest).
// Stale-while-revalidate sur les CDN (fontes Google, soundfonts, @tonejs/midi).
// Network-only (sans cache) sur l'API BitMidi (recherche dynamique).

const VERSION = 'etude-v0.41.1';
const CORE = `${VERSION}-core`;
const CDN  = `${VERSION}-cdn`;

// Liste des ressources à pré-cacher au moment de l'install.
const PRECACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './lessons.js',
  './metronome.js',
  './mic.js',
  './harmony.js',
  './staff.js',
  './dashboard.js',
  './improv.js',
  './mascot.js',
  './daily.js',
  './storage.js',
  './audio-to-midi.js',
  './songs.js',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png',
  './icon-maskable-512.png',
  './favicon-32.png',
  './favicon-16.png',
  './favicon.ico',
];

// CDN externes considérés comme "statiques" qu'on peut SWR.
const CDN_HOSTS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdn.jsdelivr.net',     // soundfont-player + @tonejs/midi
  'gleitz.github.io',     // soundfont samples (MusyngKite)
];

// Pas de cache pour ces hosts.
const NETWORK_ONLY_HOSTS = [
  'bitmidi.com',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CORE).then((cache) => cache.addAll(PRECACHE))
      .catch((err) => console.error('[sw] precache failed', err))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => {
      if (k !== CORE && k !== CDN) return caches.delete(k);
    }));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Network-only for live APIs.
  if (NETWORK_ONLY_HOSTS.some((h) => url.hostname.endsWith(h))) {
    return;  // let the browser handle it normally
  }

  // CDN: stale-while-revalidate.
  if (CDN_HOSTS.some((h) => url.hostname.endsWith(h))) {
    event.respondWith(staleWhileRevalidate(req, CDN));
    return;
  }

  // Same-origin app shell: network-first (fallback to cache when offline).
  // Avoids the "I just deployed but still see the old version" trap.
  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(req, CORE));
    return;
  }
});

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const resp = await fetch(req);
    if (resp.ok) cache.put(req, resp.clone());
    return resp;
  } catch (err) {
    const cached = await cache.match(req);
    if (cached) return cached;
    if (req.mode === 'navigate') {
      const fallback = await cache.match('./index.html');
      if (fallback) return fallback;
    }
    throw err;
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const networkPromise = fetch(req).then((resp) => {
    if (resp.ok) cache.put(req, resp.clone());
    return resp;
  }).catch(() => cached);
  return cached || networkPromise;
}

// Allow the page to ping the SW for an update check / cache flush.
self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting();
  if (event.data === 'clear-cache') {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
  }
});
