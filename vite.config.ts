import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

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
    tailwindcss(),
    tanstackStart({
      spa: { enabled: true, prerender: { outputPath: '/index.html' } },
    }),
    viteReact(),
  ],
})
