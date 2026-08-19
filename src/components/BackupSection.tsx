import { useRef, useState, type ChangeEvent } from "react";
import { Download, Upload } from "lucide-react";
import type { AppData } from "@/domain/types";
import { backupFilename, downloadJson, parseBackup } from "@/lib/backup";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function BackupSection({
  data,
  onReplace,
}: {
  data: AppData;
  onReplace: (data: AppData) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<AppData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const exportNow = () => {
    downloadJson(data, backupFilename());
    setError(null);
    setDone("バックアップを書き出しました。");
  };

  const pickFile = () => {
    setError(null);
    setDone(null);
    inputRef.current?.click();
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // 同じファイルを続けて選べるように
    if (!file) return;
    try {
      const parsed = parseBackup(await file.text());
      setPending(parsed);
      setError(null);
    } catch {
      setError(
        "読み込めませんでした。正しいバックアップ(JSON)を選んでください。既存のデータは変更していません。",
      );
    }
  };

  const confirmImport = () => {
    if (!pending) return;
    // 取り消せるよう、現在のデータを自動で書き出してから置き換える。
    downloadJson(data, backupFilename(new Date(), "before-import"));
    onReplace(pending);
    setDone(`復元しました(症状 ${pending.issues.length} 件)。`);
    setPending(null);
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div>
          <h2 className="font-serif text-base font-semibold">バックアップ</h2>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            健康の記録は端末の中だけに保存されます。機種変更やデータ消去に備え、ときどき書き出して保管してください。
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button variant="outline" onClick={exportNow}>
            <Download />
            バックアップを書き出す
          </Button>
          <Button variant="outline" onClick={pickFile}>
            <Upload />
            バックアップから復元(上書き)
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            onChange={onFile}
            className="hidden"
          />
        </div>

        {error && (
          <p className="text-destructive border-destructive/40 bg-destructive/5 rounded-md border px-3 py-2 text-sm">
            {error}
          </p>
        )}
        {done && <p className="text-primary text-sm">{done}</p>}

        <p className="text-muted-foreground text-xs tabular-nums">
          現在: 症状 {data.issues.length} 件 / 調子 {data.daily.length} 日分
        </p>
      </CardContent>

      <AlertDialog
        open={pending !== null}
        onOpenChange={(o) => {
          if (!o) setPending(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">
              復元(上書き)しますか?
            </AlertDialogTitle>
            <AlertDialogDescription>
              現在のデータ(症状 {data.issues.length} 件)はすべて、選んだファイルの内容(症状{" "}
              {pending?.issues.length ?? 0} 件)に置き換わります。取り消せるよう、現在のデータのバックアップを自動で書き出します。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={confirmImport}>
              復元する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
