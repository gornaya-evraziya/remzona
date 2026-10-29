// Ремзона ГЕ: оболочка приложения работает без связи (данные -- через очередь в index.html), показ уведомлений
const CACHE = "remzona-v2";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./logo.png", "./icon-192.png", "./icon-512.png",
  "./supabase.js"]; // supabase-js 2.45.4 (dist/umd из пакета npm) -- со своего сайта, без стороннего CDN

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// страница -- сначала сеть (свежая версия), без связи -- из кэша; запросы к базе не кэшируются
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.hostname.endsWith("supabase.co")) return;
  e.respondWith(fetch(e.request).then((r) => {
    if (r.ok && u.origin === location.origin) {
      const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy));
    }
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("./index.html"))));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window" }).then((cs) => cs.length ? cs[0].focus() : self.clients.openWindow("./")));
});
