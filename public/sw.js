// ビルド時に vite.config.ts がアセット一覧のハッシュへ置き換える。版が変わると SW が入れ替わり、新しい版を保存し直す。
const ASSET_CACHE = 'naotta-assets-__BUILD_HASH__'
const NAVIGATE_TIMEOUT_MS = 3000

const assetUrls = (text) =>
  (text.match(/\/?assets\/[\w.-]+\.(?:js|css)/g) ?? []).map((u) => (u.startsWith('/') ? u : `/${u}`))

// skipWaiting はしない。開いたままの古い版が、消された古いキャッシュの JS を取りに行って壊れるのを防ぐ。
// 新しい版へは、アプリを完全に閉じて開き直したときに切り替わる。
self.addEventListener('install', (event) => {
  // 電波のない場所でもホーム画面から開けるよう、トップページと全アセットを先に保存する。
  // 初回訪問では SW が load 後に登録されるため、ページが読んだ JS/CSS はキャッシュに入っていない。
  event.waitUntil(caches.open(ASSET_CACHE).then(async (c) => {
    const page = await fetch('/')
    if (!page.ok) throw new Error(`/ returned ${page.status}`)
    // QR コードはダイアログを開くまで読み込まれないので、名指しで保存する。
    const urls = new Set(['/qr.svg', ...assetUrls(await page.clone().text())])
    // 画面ごとに分けた JS は HTML に載らず、JS 内の依存一覧にだけ書かれている。
    for (const url of [...urls].filter((u) => u.endsWith('.js'))) {
      const js = await fetch(url)
      if (js.ok) for (const u of assetUrls(await js.text())) urls.add(u)
    }
    await c.addAll([...urls])
    await c.put('/', page)
  }))
})

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

  // ページ本体: NetworkFirst。オフラインなら保存済みのページ、なければトップページを返す。
  if (request.mode === 'navigate') {
    const network = fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone()
        event.waitUntil(caches.open(ASSET_CACHE).then((c) => c.put(request, copy)))
      }
      return response
    })
    // タイムアウトで先に応答した後も、遅れて届いたページを保存できるようイベントの寿命を延ばす。
    event.waitUntil(network.catch(() => {}))
    // 電波が弱いと fetch がなかなか失敗しないため、待ち時間に上限を設ける。
    const timeout = new Promise((_, reject) => setTimeout(reject, NAVIGATE_TIMEOUT_MS))
    event.respondWith(
      Promise.race([network, timeout]).catch(() =>
        caches.match(request).then((r) => r ?? caches.match('/')).then((r) => r ?? network),
      ),
    )
    return
  }

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
          event.waitUntil(caches.open(ASSET_CACHE).then((c) => c.put(request, copy)))
          return response
        })
      }),
    )
  }
})
