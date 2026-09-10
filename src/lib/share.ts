// 人に薦めるときに渡すもの(→ ADR 0007)。
//
// 渡す先はアプリ本体(/)ではなく紹介ページ(/about)。まだ使っていない人が
// 説明のない空の記録アプリに着地しないようにするため。
// display: standalone のPWAにはURLバーが無く、利用者は自分でURLを取れないので、
// この導線が無いと「これ良いよ」と言いたくても渡す手段が無い。

export const SHARE_URL = "https://naotta.over40web.club/about";

const SHARE_TITLE = "なおったメモ";

// 三人称・説明のみ。推薦文にはしない。
// 一人称の推薦文は「利用者の口にアプリが言葉を入れる」ことになるうえ、
// 健康アプリなので、送り手が意図しない自己開示に読まれかねない。
// リンクを展開しない相手(SMS・メモ等)でも何のリンクか分かるよう、1行だけ添える。
const SHARE_TEXT =
  "なおったメモ — 症状のはじまりから「治った」まで記録できる、端末内だけの体調メモです。";

export type ShareResult = "shared" | "cancelled" | "copied" | "failed";

/**
 * 共有シートを開く。使えない環境ではクリップボードへ落とす。
 * (クリップボードのフォールバックは ContactEmail / VisitExport と同じ流儀)
 */
export async function shareApp(): Promise<ShareResult> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: SHARE_TITLE,
        text: SHARE_TEXT,
        url: SHARE_URL,
      });
      return "shared";
    } catch (e) {
      // 利用者が共有シートを閉じただけ。ここでコピーに落とすと、
      // やめたつもりなのにクリップボードが書き換わって驚かせる。
      if (e instanceof DOMException && e.name === "AbortError")
        return "cancelled";
    }
  }
  try {
    await navigator.clipboard.writeText(`${SHARE_TEXT}\n${SHARE_URL}`);
    return "copied";
  } catch {
    return "failed";
  }
}
