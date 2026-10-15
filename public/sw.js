/* FUTURO.IO — service worker minimale.
 * Pagine: prima la rete (così ogni aggiornamento del sito si vede subito), cache solo se offline.
 * Asset statici con hash nel nome: prima la cache.
 * Non intercetta né memorizza dati dell'utente: le simulazioni restano solo in localStorage.
 * Tutti i percorsi sono relativi allo "scope", quindi funziona anche in un sottopercorso (GitHub Pages).
 */
const CACHE = "futuro-io-v2";
const SCOPE = self.registration.scope; // es. https://utente.github.io/futuro-io/
const PRECACHE = ["", "simulatore/", "risultati/", "come-funziona/", "metodologia/", "privacy/", "icon.svg"].map((p) => SCOPE + p);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !req.url.startsWith(SCOPE)) return;

  if (url.pathname.includes("/_next/static/") || url.pathname.endsWith(".svg")) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          }),
      ),
    );
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match(SCOPE))),
    );
  }
});
