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
        <Scripts />
      </body>
    </html>
  );
}

const SITE_DESCRIPTION =
  "症状のはじまりから「治った」まで記録する、個人用の体調メモ。通院のとき、まとめてそのまま見せられる。";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { title: "なおったメモ" },
      { name: "description", content: SITE_DESCRIPTION },
      { name: "theme-color", content: "#F2F0EA" },
    ],
    links: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
  }),
  component: () => (
    <RootDocument>
      <Outlet />
    </RootDocument>
  ),
});
