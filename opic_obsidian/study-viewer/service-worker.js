"use strict";

const CACHE_NAME = "opic-practice-v6";
const APP_SHELL = [
  "./index.html",
  "./compact.html",
  "./compact-styles.css",
  "./compact-app.js",
  "./data.js",
  "./manifest.webmanifest",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  const cacheUrl = new URL(request.url);
  cacheUrl.search = "";
  const cacheRequest = new Request(cacheUrl.toString(), {
    credentials: "same-origin",
  });

  event.respondWith(
    fetch(request, { cache: "no-store" })
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(cacheRequest, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(cacheRequest);
        if (cached) {
          return cached;
        }
        if (request.mode === "navigate") {
          return caches.match("./compact.html");
        }
        return Response.error();
      }),
  );
});
