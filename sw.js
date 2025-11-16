self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  clients.claim();
});

self.addEventListener('fetch', event => {
  // نترك المتصفح يتصرف كما هو (فقط لشرط وجود service worker)
});
