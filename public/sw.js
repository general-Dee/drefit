/* Aremo service worker (hand-written, no build step).
 * - App shell + static assets: cache-first (/_next/static, icons, offline page)
 * - GET /api/workouts and /api/workouts/:id: stale-while-revalidate
 * - Navigations / RSC requests for /dashboard/workouts*: network-first,
 *   falling back to the cached copy, then /offline.html
 * - Never cached: auth, payments, subscription, cron, settings and all
 *   non-GET requests.
 */
const VERSION = "v1"
const SHELL_CACHE = `drefit-shell-${VERSION}`
const DATA_CACHE = `drefit-data-${VERSION}`
const PAGE_CACHE = `drefit-pages-${VERSION}`
const SHELL_URLS = ["/offline.html", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"]

const NEVER_CACHE = [
  /^\/api\/auth(\/|$)/,
  /^\/api\/paystack(\/|$)/,
  /^\/api\/register(\/|$)/,
  /^\/api\/cron(\/|$)/,
  /^\/api\/settings(\/|$)/,
  /^\/subscription(\/|$)/,
  /^\/login(\/|$)/,
  /^\/register(\/|$)/,
  /^\/(forgot|reset)-password(\/|$)/,
  /^\/admin(\/|$)/,
]

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((c) => c.addAll(SHELL_URLS)).then(() => self.skipWaiting()))
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("drefit-") && !k.endsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

// Sign-out (or account switch) clears every cached user response.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CLEAR_USER_CACHES") {
    event.waitUntil(Promise.all([caches.delete(DATA_CACHE), caches.delete(PAGE_CACHE)]))
  }
})

function isWorkoutsApi(path) {
  return /^\/api\/workouts(\/[^/]+)?$/.test(path)
}
function isWorkoutsPage(path) {
  return /^\/dashboard\/workouts(\/[^/]+)?$/.test(path)
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DATA_CACHE)
  const cached = await cache.match(request)
  const network = fetch(request)
    .then((res) => {
      if (res.ok) cache.put(request, res.clone())
      return res
    })
    .catch(() => null)
  if (cached) {
    network.catch(() => {})
    return cached
  }
  const res = await network
  return res || new Response(JSON.stringify({ error: "You're offline" }), { status: 503, headers: { "Content-Type": "application/json" } })
}

async function networkFirstPage(request, cacheKey) {
  const cache = await caches.open(PAGE_CACHE)
  try {
    const res = await fetch(request)
    if (res.ok && !res.redirected) cache.put(cacheKey, res.clone())
    return res
  } catch (err) {
    const cached = await cache.match(cacheKey)
    if (cached) return cached
    if (request.mode === "navigate") return (await caches.match("/offline.html")) || Response.error()
    throw err
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  const res = await fetch(request)
  if (res.ok) (await caches.open(SHELL_CACHE)).put(request, res.clone())
  return res
}

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  const path = url.pathname
  if (NEVER_CACHE.some((re) => re.test(path))) return

  if (path.startsWith("/_next/static/") || path.startsWith("/icons/")) {
    event.respondWith(cacheFirst(request))
    return
  }
  if (isWorkoutsApi(path)) {
    event.respondWith(staleWhileRevalidate(request))
    return
  }
  const isRsc = request.headers.get("RSC") === "1"
  if (isWorkoutsPage(path) || (request.mode === "navigate" && path === "/dashboard")) {
    // RSC payloads carry a changing ?_rsc= param; key them by path.
    const key = isRsc ? new Request(`${url.origin}${path}?__drefit_rsc=1`) : new Request(`${url.origin}${path}`)
    event.respondWith(networkFirstPage(request, key))
    return
  }
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(async () => (await caches.match("/offline.html")) || Response.error()))
  }
})
