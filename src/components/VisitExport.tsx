import { useState } from "react";
import { Check, ClipboardCopy } from "lucide-react";
import type { AppData } from "@/domain/types";
import { buildVisitExport } from "@/lib/visitExport";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function VisitExport({ data, now }: { data: AppData; now: Date }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const text = open ? buildVisitExport(data, now) : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // クリップボード API が使えない環境では、テキストを選択してコピーしてもらう。
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setCopied(false);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <ClipboardCopy />
          通院用にまとめてコピー
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">通院用のまとめ</DialogTitle>
          <DialogDescription>
            そのままコピーして、診察や問診に使えます。
          </DialogDescription>
        </DialogHeader>
        <pre className="bg-muted/50 border-border max-h-[50vh] overflow-auto rounded-lg border p-3 text-sm whitespace-pre-wrap">
          {text}
        </pre>
        <DialogFooter className="gap-2 sm:justify-between">
          <DialogClose asChild>
            <Button variant="ghost">閉じる</Button>
          </DialogClose>
          <Button onClick={copy}>
            {copied ? (
              <>
                <Check />
                コピーしました
              </>
            ) : (
              <>
                <ClipboardCopy />
                コピー
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
