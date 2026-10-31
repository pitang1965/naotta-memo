/** 端末への保存に失敗したときの警告。直前の変更は反映されていないことを伝える */
export function SaveErrorAlert() {
  return (
    <div
      role="alert"
      className="border-destructive/40 bg-destructive/5 text-foreground rounded-xl border p-4 text-sm"
    >
      <p className="text-destructive mb-1 font-semibold">
        記録を保存できませんでした
      </p>
      <p className="text-muted-foreground">
        端末の保存容量が足りない可能性があります。直前の変更は反映されていません。
      </p>
    </div>
  );
}
