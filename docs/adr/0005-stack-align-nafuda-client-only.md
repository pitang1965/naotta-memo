# 0005. スタックは nafuda に揃える(TanStack Start + React 19 + Tailwind v4 + shadcn/ui)、ただしクライアント専用

- ステータス: 承認
- 日付: 2026-08-19

## 背景

Phase 1 の技術スタックを決めるにあたり、作者は姉妹プロジェクト `../nafuda` と揃えたいと希望した。
共通のツール・流儀・コンポーネント資産を再利用でき、頭の切り替えコストが下がるため。

`../nafuda` の構成:
- TanStack Start(`@tanstack/react-start`)＋ TanStack Router ＋ TanStack Query
- React 19 / TypeScript ~6 / Tailwind CSS v4(`@tailwindcss/vite`)
- shadcn/ui(new-york, baseColor neutral, lucide)＋ radix-ui / CVA / clsx / tailwind-merge
- Cloudflare Pages 配信(`@cloudflare/vite-plugin`, `dist/client`)/ pnpm
- PWA は手書き `src/sw.js` を配布物へコピー(workbox-build)
- さらに drizzle + Neon(Postgres)/ better-auth / realtime Worker(= サーバー・DB・認証)

一方「なおったメモ」は **サーバーなし・localStorage のみ・個人用**(ADR 0003/0004 ほか)。
TanStack Start は本来 SSR・サーバー関数を持てるメタフレームワークであり、
「サーバーを持たないアプリに、なぜサーバー可能なフレームワークを使うのか?」は将来必ず問われる。

## 決定

**スタックは nafuda に揃える。ただしサーバー側の能力は使わず、クライアント専用として用いる。**

1. 採用: TanStack Start / Router、React 19、TypeScript、Tailwind v4、shadcn/ui(new-york・neutral・lucide)、
   `@cloudflare/vite-plugin`、pnpm、PWA は nafuda と同じ手書き `sw.js` 方式。エイリアス `@/` も踏襲。
2. **不採用**: drizzle / Neon / better-auth / realtime / サーバー関数。データは全て localStorage。
3. TanStack Start は使うが**サーバー関数に依存せず、静的(SPA/prerender)として Cloudflare Pages に配信**
   (nafuda と同じ `dist/client`)。
4. localStorage はクライアント専用のため、**SSR/prerender 中に触れない**。ストレージ抽象層(ADR で決めた
   隔離方針)へのアクセスは effect/クライアント境界に閉じ、サーバー描画時は参照しない。
5. TanStack Query は Phase 1 では**入れない**(localStorage は同期で、サーバー取得もないため)。
   気圧取得(Open-Meteo)のキャッシュが必要になれば後で足す。

## 結果

**良い方向:**
- 姉妹プロジェクトと道具・流儀・UI コンポーネントを共有でき、学習・保守コストが下がる。
- shadcn/Tailwind v4 の資産をそのまま使える。Cloudflare Pages への配信も nafuda の手順を流用できる。

**代償・要フォロー:**
- サーバー可能なフレームワークを"あえてサーバーなしで"使うため、SSR と localStorage の境界に注意が要る
  (プリレンダー時にクライアント専用 API を触ると壊れる)。
- フルスタック機能(認証・DB・realtime)を持たない分、nafuda のテンプレートから相当量を削ぎ落とす必要がある。
- 将来 端末間転送(Phase 2)等でサーバーが要るとなれば、TanStack Start のサーバー面を後から使える利点は残る。

採用しなかった案:

- **Svelte + Vite / Vanilla JS**: より軽量だが、姉妹プロジェクトとの一貫性(資産再利用・流儀統一)という
  作者の主目的を満たさない。
