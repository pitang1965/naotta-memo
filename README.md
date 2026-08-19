# なおったメモ

症状の「はじまり」から「治った」まで記録する、個人用の体調メモ(PWA)。
悪化した日だけでなく、治った日も取りこぼさず残すことを目的とする。

- ドメインの用語集: [CONTEXT.md](./CONTEXT.md)
- 設計判断の記録: [docs/adr/](./docs/adr/)
- 暫定ランディングページ: `landing.html`

## 技術スタック(ADR 0005)

姉妹プロジェクト `../nafuda` に揃える。ただし**クライアント専用**で、サーバー/DB/認証は持たない。

- TanStack Start + TanStack Router / React 19 / TypeScript
- Tailwind CSS v4 + shadcn/ui(new-york / neutral / lucide)
- Cloudflare Pages 配信 / pnpm / 手書き Service Worker(`src/sw.js`)
- データは端末内 localStorage のみ。サーバー関数・DB・認証は不使用。

## 開発

```bash
pnpm install
pnpm dev
```

## 未実装(土台の残り)

- Cloudflare Pages への配信バンドル配線(SSR worker → `dist/client/_worker.js`)は
  デプロイ着手時に追加する。現状の `build` は `tsc -b && vite build` まで。
- ストレージ抽象層 / データモデル(症状・時刻つきエントリ)/ 記録ループは次のステップ。
