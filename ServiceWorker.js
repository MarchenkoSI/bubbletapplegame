"use strict";
// Written by WebBuildPostprocessor from the actual output of each Unity build.
importScripts("offline-config.js");
const scopeUrl = new URL("./", self.location.href);
const cachePrefix = "bubbletapple:" + scopeUrl.pathname + ":";
const cacheName = cachePrefix + OFFLINE_BUILD_ID;

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    await cache.addAll(OFFLINE_FILES.map(path => new Request(new URL(path, scopeUrl), { cache: "reload" })));
  })());
  // Let existing sessions finish on their original version. No skipWaiting().
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(cachePrefix) && key !== cacheName).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== scopeUrl.origin || !url.pathname.startsWith(scopeUrl.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    const isStartPage = event.request.mode === "navigate" &&
      (url.pathname === scopeUrl.pathname || url.pathname === scopeUrl.pathname + "index.html");
    const cached = isStartPage
      ? await cache.match(new URL("index.html", scopeUrl).href)
      : await cache.match(event.request, { ignoreSearch: true });
    return cached || fetch(event.request);
  })());
});
