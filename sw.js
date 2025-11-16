self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// شبكة مباشرة بدون كاش معقد – يكفي فقط لكي يتعرف المتصفح أنه PWA
self.addEventListener("fetch", (event) => {
  return;
});
