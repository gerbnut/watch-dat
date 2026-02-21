// Push notification support
self.addEventListener('push', (e) => {
  if (!e.data) return
  let payload
  try { payload = e.data.json() } catch { return }

  const title = payload.title ?? 'Watch Dat'
  const options = {
    body: payload.body ?? '',
    icon: payload.icon ?? '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: payload.url ?? '/' },
    vibrate: [100, 50, 100],
  }

  e.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = e.notification.data?.url ?? '/'
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})

const CACHE_NAME = 'watchdat-shell-v1'
const SHELL_URLS = ['/', '/films', '/diary', '/watchlist', '/lists']

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(SHELL_URLS.map((url) => cache.add(url)))
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  // Only handle same-origin GET requests
  if (e.request.method !== 'GET') return
  const url = new URL(e.request.url)
  if (url.origin !== self.location.origin) return
  // Skip API routes and Next.js internals
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/')) return

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok && SHELL_URLS.includes(url.pathname)) {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone))
        }
        return res
      })
      .catch(() => caches.match(e.request))
  )
})
