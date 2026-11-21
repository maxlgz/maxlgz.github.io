// Alibi — service worker limité à /alibi/.
// But : ne jamais servir une version périmée. Chaque fichier du jeu est redemandé au réseau en
// contournant le cache HTTP du navigateur (Safari garde volontiers les modules JS), puis copié
// dans un cache de secours qui ne sert que hors ligne.

const CACHE = 'alibi-secours-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('alibi-') && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(fresh(req, url));
});

async function fresh(req, url) {
  const key = url.origin + url.pathname + url.search;
  try {
    const resp = await fetch(key, { cache: 'no-store', credentials: 'same-origin' });
    // Une navigation ne peut pas recevoir une réponse déjà redirigée : on renvoie la redirection.
    if (resp.redirected && req.mode === 'navigate') return Response.redirect(resp.url, 302);
    if (resp.ok) {
      const cache = await caches.open(CACHE);
      await cache.put(key, resp.clone());
    }
    return uncached(resp);
  } catch (err) {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(key);
    if (hit) return uncached(hit);
    if (req.mode === 'navigate') {
      const shell = await cache.match(new URL('./', self.registration.scope).href);
      if (shell) return uncached(shell);
    }
    throw err;
  }
}

// Le navigateur garde aussi en mémoire les réponses reçues, d'après leurs en-têtes (GitHub Pages
// annonce dix minutes). On les lui rend marquées « à ne pas conserver ».
function uncached(resp) {
  if ([101, 204, 205, 304].includes(resp.status)) return resp;
  const headers = new Headers(resp.headers);
  headers.set('Cache-Control', 'no-store');
  headers.delete('ETag');
  headers.delete('Last-Modified');
  headers.delete('Expires');
  return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers });
}
