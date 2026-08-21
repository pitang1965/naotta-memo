# なおったメモ

症状の「はじまり」から「治った」まで記録する、個人用の体調メモ(PWA)。
悪化した日だけでなく、治った日も取りこぼさず残すことを目的とする。

- ドメインの用語集: [CONTEXT.md](./CONTEXT.md)
- 設計判断の記録: [docs/adr/](./docs/adr/)
- 暫定ランディングページ: `landing.html`
- 本番: https://naotta.over40web.club

## 技術スタック(ADR 0005)

姉妹プロジェクト `../nafuda` に揃える。ただし**クライアント専用**で、サーバー/DB/認証は持たない。

- TanStack Start + TanStack Router / React 19 / TypeScript
- Tailwind CSS v4 + shadcn/ui(new-york / neutral / lucide)
- Cloudflare Pages 配信 / pnpm / 手書き Service Worker(`public/sw.js`)
- データは端末内 localStorage のみ。サーバー関数・DB・認証は不使用。

サーバーを持たないので、ビルドは SPA モードでシェルを静的プリレンダーするだけで、
`_worker.js` は出力されない。全 URL には `public/_redirects` で同じ `index.html` を返し、
以降の経路はクライアントが引き受ける。

## 開発

```bash
pnpm install
pnpm dev
```

| コマンド         | 内容                                     |
| ---------------- | ---------------------------------------- |
| `pnpm dev`       | 開発サーバー                             |
| `pnpm build`     | 型検査 + ビルド + プリレンダー           |
| `pnpm preview`   | ビルド結果の確認                         |
| `pnpm test`      | Vitest                                   |
| `pnpm lint`      | ESLint                                   |
| `pnpm format`    | Prettier(`src/` を書き換え)              |
| `pnpm icons`     | アイコンと OG 画像の生成(下記)           |
| `pnpm deploy:cf` | ビルドして Cloudflare Pages へ配信(下記) |

`deploy` ではなく `deploy:cf` なのは、`pnpm deploy` が pnpm の組み込みコマンドで衝突するため。

## アイコンと OG 画像

`public/` のアイコン・`og.png`・ショートカット用アイコンは手書きではなく
[scripts/icon/](./scripts/icon/) で生成し、成果物をコミットしている。
図形の出どころは `scripts/icon/shapes.mjs` ひとつだけで、
`build.mjs`(SVG と `BrandMark.tsx`)/ `raster.mjs`(PNG)/ `og.mjs`(OG・ショートカット)が
書き出し先ごとにそれを包む。`pnpm icons` で全部作り直せる。

OG 画像だけは游明朝を直接読むので、**Windows でしか焼き直せない**。
ビルドには要らない(成果物をコミットしてあるため)ので、CI では走らせない。

## デプロイ

Cloudflare Pages の **Direct Upload** プロジェクト(`naotta-memo`)。
**Git 連携していないので、push しても自動デプロイされない。**
反映するには明示的に流す:

```bash
pnpm deploy:cf
```

Direct Upload のプロジェクトは後から Git 連携に切り替えられない。
push で自動デプロイにしたい場合は、GitHub Actions から同じ `wrangler pages deploy` を
叩くか(独自ドメインはそのまま使える)、新規プロジェクトを作って移設することになる。

## Phase 2 以降

- **計測**: 数値(体温など)の構造化・グラフ化・自動集計。Phase 1 では時刻つきエントリの
  メモとして自由記述で書ける。→ ADR 0003
- **バックアップのマージ**: 現状のインポートは検証と置き換えのみ。→ `src/lib/backup.ts`
- **気圧との突き合わせ**: エピソード単位での照合。→ CONTEXT.md
