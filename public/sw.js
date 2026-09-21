const CACHE_NAME = "cmec-cache-v1";
const OFFLINE_URL = "/login";

const PRECACHE_ASSETS = ["/logo.png", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never intercept API/document/action routes - always go to network.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/checkin/")) {
    return;
  }

  // Static assets: cache-first.
  if (PRECACHE_ASSETS.includes(url.pathname) || url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
    return;
  }

  // Pages: network-first, fallback to offline page when unreachable.
  event.respondWith(
    fetch(request).catch(() => caches.match(OFFLINE_URL).then((res) => res || Response.error()))
  );
});
