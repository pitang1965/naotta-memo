const ASSET_CACHE = 'naotta-assets-v2'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== ASSET_CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Vite が配信するソースや依存モジュールをキャッシュしない。
  // 同じ URL の旧コードが残ると、更新後の React と混在してしまう。
  if (
    (request.destination === 'script' || request.destination === 'style') &&
    !url.pathname.startsWith('/assets/')
  ) return

  // 静的アセット (JS/CSS/画像/フォント): CacheFirst でオフライン起動を支える。
  // データは localStorage 側にあるため、SW はアプリの外殻だけをキャッシュすればよい。
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          const copy = response.clone()
          caches.open(ASSET_CACHE).then((c) => c.put(request, copy))
          return response
        })
      }),
    )
  }
})
