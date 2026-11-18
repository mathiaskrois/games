// Match offline navigations to their specific game.
const CACHE = "krois-games-shell-__BUILD__";
const BASE = "/games/";
const ASSETS = "__ASSETS__";
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    if (!Array.isArray(ASSETS)) return; // Development source is deliberately uncached.
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS.map(name => BASE + name));
    await self.skipWaiting();
  })());
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    if (!Array.isArray(ASSETS)) return;
    for (const key of await caches.keys()) if (key.startsWith("krois-games-shell-") && key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (!Array.isArray(ASSETS) || event.request.method !== "GET" || url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (event.request.mode === "navigate") {
      try { return await fetch(event.request); }
      catch {
        const index = url.pathname.endsWith(".html") ? url.pathname : url.pathname.replace(/\/?$/, "/") + "index.html";
        return await cache.match(index) || new Response("Page unavailable offline", { status: 404 });
      }
    }
    return await cache.match(event.request) || fetch(event.request);
  })());
});
