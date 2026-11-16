self.addEventListener('install', event => {
  event.waitUntil(caches.open('damgabir-offline-v1').then(cache => cache.add('/offline.html')))
})
self.addEventListener('fetch', event => {
  const path = new URL(event.request.url).pathname
  if (event.request.mode !== 'navigate' || (path !== '/' && !/^\/isletme\/[a-z0-9-]+\/?$/.test(path))) return
  event.respondWith(fetch(event.request).catch(() => caches.match('/offline.html')))
})
