import {
  createRootRoute,
  Outlet,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect } from "react";
import "../index.css";
import { BottomNav } from "../components/BottomNav";
import { Celebration } from "../components/Celebration";

function RootDocument({ children }: { children: ReactNode }) {
  // Service Worker 登録(PWA)。クライアントでのみ動く。
  useEffect(() => {
    if ("serviceWorker" in navigator && typeof window !== "undefined") {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/" })
          .catch((err) => console.warn("[SW] Registration failed:", err));
      });
    }
  }, []);

  return (
    <html lang="ja">
      <head>
        {/* beforeinstallprompt は React ハイドレーション前に発火するため早期キャプチャ */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__pwaPrompt=e;});",
          }}
        />
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, viewport-fit=cover"
        />
        <link rel="manifest" href="/manifest.webmanifest" />
        <HeadContent />
      </head>
      <body>
        {children}
        <BottomNav />
        <Celebration />
        <Scripts />
      </body>
    </html>
  );
}

const SITE_NAME = "なおったメモ";
// ホーム画面のラベル用。端末側で省略記号が付かない長さに切ってある。
const SITE_SHORT_NAME = "なおった";
const SITE_URL = "https://naotta.over40web.club";
const SITE_DESCRIPTION =
  "症状のはじまりから「治った」まで記録する、個人用の体調メモ。通院のとき、まとめてそのまま見せられる。";
// OG 画像は tmp/icon/og.mjs で生成する。SNS 側は相対パスを解決しないので絶対 URL で渡す。
const OG_IMAGE = `${SITE_URL}/og.png`;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { title: SITE_NAME },
      { name: "description", content: SITE_DESCRIPTION },
      { name: "theme-color", content: "#F2F0EA" },
      // .dark トークンは定義してあるが適用する導線が無く、UI は常に明るい。
      // 宣言しておかないと iOS が勝手に暗転させ、和紙の地色が濁る。
      { name: "color-scheme", content: "light" },
      // メモ本文の数字(体温・血圧など)を iOS が電話番号リンクにするのを止める。
      { name: "format-detection", content: "telephone=no" },

      // ホーム画面から起動したときの見え方。apple- 付きは非標準だが iOS はまだこちらを読む。
      { name: "application-name", content: SITE_NAME },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      // ホーム画面のラベルは manifest の short_name と揃えて短縮形。
      // 「なおったメモ」だと 6 文字目が切られて「なおった…」になってしまう。
      { name: "apple-mobile-web-app-title", content: SITE_SHORT_NAME },
      // 地色が明るいので default(暗い文字のステータスバー)。black-translucent にすると
      // 本文が時計の下に潜り込む。
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },

      { property: "og:type", content: "website" },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:locale", content: "ja_JP" },
      { property: "og:title", content: SITE_NAME },
      { property: "og:description", content: SITE_DESCRIPTION },
      { property: "og:url", content: `${SITE_URL}/` },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      {
        property: "og:image:alt",
        content: `${SITE_NAME} — ${SITE_DESCRIPTION}`,
      },

      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: SITE_NAME },
      { name: "twitter:description", content: SITE_DESCRIPTION },
      { name: "twitter:image", content: OG_IMAGE },
      {
        name: "twitter:image:alt",
        content: `${SITE_NAME} — ${SITE_DESCRIPTION}`,
      },
    ],
    // iOS のホーム画面は SVG を読まないので apple-touch-icon の PNG が要る。
    // canonical は常にルート。_redirects で全 URL に同じシェルを返す SPA なので、
    // 実際に配信される文書は 1 つしかない。
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "canonical", href: `${SITE_URL}/` },
    ],
  }),
  component: () => (
    <RootDocument>
      <Outlet />
    </RootDocument>
  ),
});
