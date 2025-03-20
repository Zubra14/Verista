// public/service-worker.js
const CACHE_NAME = "verista-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/favicon.svg",
  "/assets/bus-icon.png",
  "/fallback-map.html",
];

// Install service worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate service worker
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch handler
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // If a match is found in the cache, return it
      if (response) {
        return response;
      }

      // Clone the request since it can only be consumed once
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest)
        .then((response) => {
          // Check if valid response
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          // Clone the response since it can only be consumed once
          const responseToCache = response.clone();

          // Cache the response
          caches.open(CACHE_NAME).then((cache) => {
            // Only cache static assets, not API calls
            if (
              event.request.url.indexOf("/api/") === -1 &&
              event.request.method === "GET"
            ) {
              cache.put(event.request, responseToCache);
            }
          });

          return response;
        })
        .catch((error) => {
          // For navigation requests, return the fallback page
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }

          // For map failures, return the fallback map
          if (event.request.url.includes("maps")) {
            return caches.match("/fallback-map.html");
          }

          // Otherwise let the error propagate
          throw error;
        });
    })
  );
});
