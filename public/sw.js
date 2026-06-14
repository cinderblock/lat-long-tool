// Hand-rolled service worker: caches the app shell at runtime so the tool
// works offline. Network-first for navigations (always fresh online, cached
// offline); stale-while-revalidate for same-origin static assets. Third-party
// requests (e.g. OpenStreetMap tiles) are left untouched — network only.
const CACHE = "latlong-tool-v1";
// sw.js is served at the app root, so its directory is the base path.
const BASE = self.location.pathname.replace(/sw\.js$/, "");

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // don't cache cross-origin

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        try {
          const fresh = await fetch(request);
          cache.put(request, fresh.clone());
          return fresh;
        } catch {
          return (
            (await cache.match(request)) ||
            (await cache.match(BASE)) ||
            (await cache.match(`${BASE}index.html`)) ||
            Response.error()
          );
        }
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request);
      const network = fetch(request)
        .then((res) => {
          if (res.ok) cache.put(request, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })(),
  );
});
