import { X } from "lucide-react";
import { isIos, isStandalone, useInstallPrompt } from "@/lib/install";
import { Button } from "@/components/ui/button";

/**
 * 「ホーム画面に追加」の案内(今日タブ)。
 *
 * 出す条件は「まだ入れていない」かつ「記録が1件以上ある」。
 * 何も使っていない人に勧めても、価値が伝わる前なので断られるだけ。
 * 「これ良いな」と思った後に出す。VisitExport と同じ出し分けの流儀。
 * スタンドアロン起動中(=もう入っている)は出さない。共有ボタンとは表示条件が逆になる。
 */
export function InstallHint({ onDismiss }: { onDismiss: () => void }) {
  const { available, install } = useInstallPrompt();

  if (isStandalone()) return null;
  // Android/デスクトップは available になってから。iOS は beforeinstallprompt が
  // 無いので、手順を文章で示すしかない。
  const ios = isIos();
  if (!available && !ios) return null;

  return (
    <div className="border-border bg-card text-card-foreground relative rounded-xl border p-4 shadow-sm">
      <button
        type="button"
        onClick={onDismiss}
        aria-label="この案内を閉じる"
        className="text-muted-foreground hover:text-foreground absolute top-2 right-2 rounded-md p-1.5"
      >
        <X className="size-4" />
      </button>

      <p className="font-serif text-sm font-semibold">ホーム画面に追加</p>
      <p className="text-muted-foreground mt-1 pr-6 text-sm leading-relaxed">
        ワンタップで開けて、電波が無いところでも記録できます。
      </p>

      {available ? (
        <Button
          variant="outline"
          className="mt-3"
          onClick={() => void install()}
        >
          追加する
        </Button>
      ) : (
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          画面下の「共有」ボタンから
          <b className="text-foreground">「ホーム画面に追加」</b>
          を選んでください。
        </p>
      )}
    </div>
  );
}
