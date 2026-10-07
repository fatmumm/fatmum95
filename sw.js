// Fat Mum 95: keeps the app itself on the phone so it opens with no signal.
const V = "fm95-0deb12cc37";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-512.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V && k !== "fm95-extra").map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET") return;                                   // talking to Google: always the network
  const u = new URL(r.url);
  if (u.origin === location.origin) {                                // the app: newest from the internet (3s max), else the saved copy
    e.respondWith(caches.open(V).then((c) => {
      const net = fetch(r, { cache: "no-cache" }).then((res) => { if (res.ok) c.put(r, res.clone()); return res; });
      const slow = new Promise((ok) => setTimeout(ok, 3000));
      return Promise.race([net.catch(() => null), slow]).then((res) => res || c.match(r, { ignoreSearch: true })
        .then((hit) => hit || net));
    }));
  } else if (/fonts\.(googleapis|gstatic)\.com|tally|googleusercontent|storage\.googleapis/.test(u.host)) {   // fonts + client photos
    e.respondWith(caches.open("fm95-extra").then((c) => c.match(r).then((hit) => hit || fetch(r).then((res) => {
      if (res.ok || res.type === "opaque") c.put(r, res.clone());
      return res;
    }).catch(() => hit))));
  }
});
