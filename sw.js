// Service worker de la LDC3e.
// Il ne supprime que ses propres caches (« ldc3e-… ») : le site partage son domaine
// github.io avec la Ligue des Savoirs, dont il ne doit pas effacer la copie hors ligne.
// Stratégie « réseau d'abord » : l'appli affiche toujours la dernière version du site
// quand il y a du réseau, et la dernière copie enregistrée sinon.
// Les résultats (Google Sheets) ne passent pas par ici : ils sont gérés par la page.
const CACHE = "ldc3e-v1";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("ldc3e-") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("./")))
  );
});
