/* Minimal offline shell. Register from index.tsx: navigator.serviceWorker.register('/sw.js') */
const SHELL = "fw-shell-v1";
const ASSETS = ["/", "/index.html", "/terrain.json", "/shelters.json"];   // add your built JS/CSS via your bundler's manifest
self.addEventListener("install", (e) => e.waitUntil(caches.open(SHELL).then((c) => c.addAll(ASSETS))));
self.addEventListener("activate", (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== SHELL).map((k) => caches.delete(k))))));
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.pathname.startsWith("/api/")) return;                            // never cache live flood data or SOS
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => {
    if (e.request.method === "GET" && r.ok) caches.open(SHELL).then((c) => c.put(e.request, r.clone()));
    return r;
  }).catch(() => caches.match("/index.html"))));
});
