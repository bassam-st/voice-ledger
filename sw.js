// sw.js
// Service Worker بسيط لتفعيل الــ PWA والكاش للتطبيق

const CACHE_NAME = "voice-ledger-v3";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./sw.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// أثناء التثبيت: تخزين الملفات الثابتة
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch((err) => {
        console.error("Cache addAll error:", err);
      });
    })
  );
});

// أثناء التفعيل: حذف أي كاش قديم
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
});

// أثناء طلب أي ملف: محاولة من الكاش أولاً ثم من الشبكة
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // نترك طلبات API العميقة تمر مباشرة (لو أضفنا سيرفر مستقبلاً)
  if (
    req.url.includes("/api/") ||
    req.method !== "GET"
  ) {
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).catch(() => cached);
    })
  );
});
