// This worker owns /ord/ only; it never reads or clears another app's caches.
const CACHE = "krois-ord-__BUILD__";
const BASE = "/ord/";
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
    for (const key of await caches.keys()) if (key.startsWith("krois-ord-") && key !== CACHE) await caches.delete(key);
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
      catch { return await cache.match(BASE + "index.html") || Response.error(); }
    }
    return await cache.match(event.request) || fetch(event.request);
  })());
});
