import { defineConfig, type Plugin } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { existsSync } from 'node:fs'

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
    tailwindcss(),
    tanstackStart({
      spa: { enabled: true, prerender: { outputPath: '/index.html' } },
    }),
    viteReact(),
  ],
})
