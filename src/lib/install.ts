// ホーム画面への追加(PWA インストール)の導線。
//
// __root.tsx が beforeinstallprompt を React のハイドレーション前に捕まえて
// window.__pwaPrompt に置いている。ここはそれを使う側。
// 捕まえるだけで使わないと、ブラウザ標準の案内を消したまま代替を出さないことになる。

import { useCallback, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __pwaPrompt?: BeforeInstallPromptEvent;
  }
}

/** ホーム画面(スタンドアロン)から起動しているか = もう入っている */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  // iOS は display-mode を長く実装しなかったので、非標準のこちらも見る。
  return (
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** iOS 系か。iOS には beforeinstallprompt が無く、手順を文章で案内するしかない */
export function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return true;
  // iPadOS は既定で Mac を名乗るため、タッチの有無で見分ける。
  return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
}

/**
 * インストールを促せる状態か、と実際に促す関数。
 * beforeinstallprompt はハイドレーションの後に発火することもあるので、
 * 捕まえ済みの値を読むだけでなく、以後のイベントも購読する。
 */
export function useInstallPrompt() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (window.__pwaPrompt) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 外部(window)に既に届いている値の取り込み
      setAvailable(true);
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      window.__pwaPrompt = e as BeforeInstallPromptEvent;
      setAvailable(true);
    };
    const onInstalled = () => {
      delete window.__pwaPrompt;
      setAvailable(false);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    const e = window.__pwaPrompt;
    if (!e) return false;
    // 同じイベントは二度使えないので、結果によらず手放す。
    delete window.__pwaPrompt;
    setAvailable(false);
    await e.prompt();
    const { outcome } = await e.userChoice;
    return outcome === "accepted";
  }, []);

  return { available, install } as const;
}
