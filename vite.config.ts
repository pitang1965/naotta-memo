import { defineConfig, type Plugin } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

/**
 * Cloudflare Pages は拡張子なしの /about を public/about.html として返すが、
 * 開発サーバーはそうせず、アプリのルーターに渡して 404 になる。
 * 「本番では動くのに手元では 404」という差が一番たちが悪いので、dev 側を本番に揃える。
 * public/ に同名の .html が実在するときだけ書き換える。
 */
function pagesStyleHtmlUrls(): Plugin {
  return {
    name: 'naotta-pages-style-html-urls',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const [pathname, query] = (req.url ?? '').split('?')
        if (/^\/[\w-]+$/.test(pathname)) {
          const file = path.resolve(
            import.meta.dirname,
            'public',
            `${pathname.slice(1)}.html`,
          )
          if (existsSync(file)) req.url = pathname + '.html' + (query ? '?' + query : '')
        }
        next()
      })
    },
  }
}

/**
 * public/sw.js のキャッシュ名に、ビルドしたアセット一覧のハッシュを埋め込む。
 * sw.js が変わらないと SW は入れ替わらず、新しい版の画面の JS が保存されないままになるため。
 */
function versionServiceWorker(): Plugin {
  const placeholder = '__BUILD_HASH__'
  return {
    name: 'naotta-version-service-worker',
    apply: 'build',
    writeBundle(options, bundle) {
      if (this.environment.name !== 'client') return
      const sw = path.join(options.dir!, 'sw.js')
      const source = readFileSync(sw, 'utf8')
      // 埋め込めないまま出すと、更新しても SW が入れ替わらない。黙って出さずにビルドを止める。
      if (!source.includes(placeholder)) throw new Error(`${sw} に ${placeholder} がありません`)
      const assets = Object.keys(bundle).filter((f) => f.startsWith('assets/')).sort()
      const digest = createHash('sha256').update(assets.join(' '))
      // public/ の画像などは名前にハッシュが付かず SW がキャッシュ優先で返すため、中身も版に含める。
      const publicDir = path.resolve(import.meta.dirname, 'public')
      for (const f of readdirSync(publicDir, { recursive: true, encoding: 'utf8' }).sort()) {
        const file = path.join(publicDir, f)
        if (statSync(file).isFile()) digest.update(f).update(readFileSync(file))
      }
      const hash = digest.digest('hex').slice(0, 8)
      writeFileSync(sw, source.replace(placeholder, hash))
    },
  }
}

// なおったメモはサーバーデータを持たない(localStorage のみ)。
// SPA モードでシェルを静的プリレンダーし、Cloudflare Pages に静的配信する(ADR 0005)。
// SW / _redirects / manifest / favicon は public/ に置き、ビルドで出力へコピーされる。
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  plugins: [
    pagesStyleHtmlUrls(),
    versionServiceWorker(),
    tailwindcss(),
    tanstackStart({
      spa: { enabled: true, prerender: { outputPath: '/index.html' } },
    }),
    viteReact(),
  ],
})
