import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import fs from 'node:fs'

// 手書き Service Worker (src/sw.js) を配布物 (dist/client) 直下へコピーする。
// Pages の配信対象は dist/client なので、そこに置かないと /sw.js が 404 になる。
function pwaPlugin(): Plugin {
  return {
    name: 'naotta-pwa',
    apply: 'build',
    writeBundle() {
      const swSrc = path.resolve('src/sw.js')
      const swDest = path.resolve('dist/client/sw.js')
      fs.mkdirSync(path.dirname(swDest), { recursive: true })
      fs.copyFileSync(swSrc, swDest)
      console.log('[naotta-pwa] sw.js copied to dist/client/')
    },
  }
}

export default defineConfig(({ command }) => ({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  plugins: [
    // バインディング(DB/R2等)は持たないが、dev を workerd 上で回して
    // Pages 配信と挙動を揃えるために Cloudflare プラグインを使う。
    cloudflare({
      configPath: command === 'serve' ? 'wrangler-dev.toml' : undefined,
      viteEnvironment: { name: 'ssr' },
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    pwaPlugin(),
  ],
  build: {
    target: ['es2020', 'chrome87', 'firefox78', 'safari14', 'edge88'],
    rollupOptions: {
      external: ['cloudflare:workers'],
    },
  },
  ssr: {
    ...(command === 'build' ? { external: ['cloudflare:workers'] } : {}),
  },
}))
