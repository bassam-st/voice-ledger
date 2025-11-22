// sw.js — نسخة جديدة لتحديث الكاش وجلب أحدث نسخة من التطبيق

const CACHE_NAME = "voice-ledger-v6"; // ← غيّرنا رقم النسخة
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./voice.js",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

// عند التثبيت: تخزين الملفات في الكاش
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// عند التفعيل: حذف أي كاش قديم
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// استراتيجية الجلب: شبكة أولاً ثم الكاش احتياطيًا
self.addEventListener("fetch", event => {
  const req = event.request;

  // لا نتدخل في طلبات أخرى (api…)
  if (req.method !== "GET") return;

  event.respondWith(
    fetch(req)
      .then(res => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
        return res;
      })
      .catch(() =>
        caches.match(req).then(cached => cached || caches.match("./index.html"))
      )
  );
});
