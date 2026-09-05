const CACHE = "library-v3-shell";
const SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./sites.json",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(SHELL.map(url => c.add(url).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const u = new URL(e.request.url);

  if (u.pathname.endsWith("/sites.json")) {
    e.respondWith(
      fetch(e.request)
        .then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  if (u.pathname.endsWith("/admin.html") || u.hostname.endsWith("github.com")) return;

  if (u.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        const network = fetch(e.request)
          .then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)) } return r })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});
