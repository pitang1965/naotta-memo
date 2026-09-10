import { useState } from "react";
import { QrCode, Share2 } from "lucide-react";
import { SHARE_URL, shareApp } from "@/lib/share";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// 利用者が知り合いに薦めるための導線(→ ADR 0007)。作者の宣伝ではない。
// ホーム画面から起動しているとURLバーが無く、利用者は自分でURLを取れないので、
// ここが唯一の受け渡し口になる。渡す先はアプリ本体ではなく紹介ページ。
export function ShareApp() {
  const [qrOpen, setQrOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const share = async () => {
    const result = await shareApp();
    if (result === "cancelled") return;
    setNotice(
      result === "shared"
        ? null
        : result === "copied"
          ? "リンクをコピーしました。貼り付けて送ってください。"
          : "コピーできませんでした。下のURLを選んでコピーしてください。",
    );
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div>
          <h2 className="font-serif text-base font-semibold">
            このアプリを人に教える
          </h2>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            アプリの説明ページを渡します。相手の記録が見えることはありません。
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button variant="outline" onClick={share}>
            <Share2 />
            共有する
          </Button>
          <Button variant="outline" onClick={() => setQrOpen(true)}>
            <QrCode />
            QRコードを見せる
          </Button>
        </div>

        {notice && <p className="text-primary text-sm">{notice}</p>}

        <p className="text-muted-foreground text-xs break-all select-all">
          {SHARE_URL}
        </p>
      </CardContent>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">なおったメモ</DialogTitle>
            <DialogDescription>
              相手のカメラで読み取ってもらってください。
            </DialogDescription>
          </DialogHeader>
          {/* URL は固定なので、実行時に作らずビルド時に焼いたものを見せる。
              画像側に明るい地色を焼き込んであるので、そのまま置く。 */}
          <img
            src="/qr.svg"
            alt={`${SHARE_URL} を開くQRコード`}
            width={280}
            height={280}
            className="mx-auto w-full max-w-[280px] rounded-lg"
          />
          <p className="text-muted-foreground text-center text-xs break-all">
            {SHARE_URL}
          </p>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
