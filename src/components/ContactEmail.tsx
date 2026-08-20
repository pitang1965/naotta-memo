import { useState } from "react";
import { Check, Copy } from "lucide-react";

const EMAIL = "info@nafuda.me";

/** 連絡先メール。クリックでクリップボードにコピー(mailto は環境依存で無反応なことがあるため)。 */
export function ContactEmail() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // クリップボードが使えない環境では、テキストを選択してコピーしてもらう。
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      title="クリックでコピー"
      className="text-primary inline-flex items-center gap-1 align-baseline hover:underline"
    >
      {EMAIL}
      {copied ? (
        <>
          <Check className="size-3.5" />
          <span className="text-muted-foreground text-xs">コピーしました</span>
        </>
      ) : (
        <Copy className="size-3.5" />
      )}
    </button>
  );
}
