/* eslint-disable no-restricted-globals */
const VERSION = "itrack-sw-v4"
const PRECACHE = [
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/gemini-mark.png",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(PRECACHE.map((u) => new Request(u, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

/**
 * Intercept same-origin GETs: static assets cache-first; HTML navigations network-first
 * so Next.js App Router always receives fresh documents.
 */
self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  const path = url.pathname
  const accept = request.headers.get("accept") || ""
  const isNavigate =
    request.mode === "navigate" || accept.includes("text/html")

  if (isNavigate) {
    event.respondWith(
      fetch(request)
        .then((res) => res)
        .catch(() => caches.match("/"))
    )
    return
  }

  const isStatic =
    path === "/manifest.json" ||
    path.startsWith("/icons/") ||
    /\.(?:png|jpg|jpeg|svg|ico|webp|woff2?|otf)$/i.test(path)

  if (!isStatic) return

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((res) => {
        if (res.ok) {
          const copy = res.clone()
          caches.open(VERSION).then((c) => c.put(request, copy))
        }
        return res
      })
    })
  )
})
