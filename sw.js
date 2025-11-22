// sw.js — خدمة بسيطة بدون كاش معقّد
self.addEventListener("install", (event) => {
  // نتثبت بسرعة بدون انتظار
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // نسيطر على كل التبويبات المفتوحة فورًا
  event.waitUntil(self.clients.claim());
});

// لا نضيف أي fetch handler
// عشان نخلي المتصفح يتصرف طبيعي وما نخزّن صفحة 404 ولا نكسر التحديثات
