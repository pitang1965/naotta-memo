import { useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import type { Checkin, MagnitudeStatus, Status } from "@/domain/types";
import { MAGNITUDE_STATUSES, isMagnitude } from "@/domain/types";
import { localDateKey, localTime } from "@/domain/time";
import { STATUS_LABEL, jpDate } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STATUS_STYLE: Record<MagnitudeStatus, string> = {
  worse: "text-destructive border-destructive/40",
  same: "text-foreground",
  better: "text-primary border-primary/50",
};

/**
 * 保存済みの1エントリ。既定は読み取り専用、鉛筆で編集モードに入る。
 * withDate=true で日付も表示(履歴のように複数日にまたがる場面向け)。
 */
export function CheckinRow({
  checkin,
  withDate = false,
  onEdit,
  onDelete,
}: {
  checkin: Checkin;
  withDate?: boolean;
  onEdit: (patch: Partial<Omit<Checkin, "id">>) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(checkin.note);
  const [status, setStatus] = useState<Status>(checkin.status);

  const startEdit = () => {
    setNote(checkin.note);
    setStatus(checkin.status);
    setEditing(true);
  };
  const save = () => {
    onEdit({ status, note: note.trim() });
    setEditing(false);
  };

  const when = withDate
    ? `${jpDate(localDateKey(checkin.at))} ${localTime(checkin.at)}`
    : localTime(checkin.at);

  if (!editing) {
    return (
      <li className="group flex items-start justify-between gap-2">
        <p className="text-sm leading-snug">
          <span className="text-muted-foreground text-xs tabular-nums">
            {when}
          </span>{" "}
          <span className="font-medium">{STATUS_LABEL[checkin.status]}</span>
          {checkin.note && (
            <span className="text-muted-foreground"> ・{checkin.note}</span>
          )}
        </p>
        <button
          onClick={startEdit}
          aria-label="この記録を編集"
          className="text-muted-foreground hover:text-foreground mt-0.5 shrink-0"
        >
          <Pencil className="size-3.5" />
        </button>
      </li>
    );
  }

  return (
    <li className="border-border bg-background flex flex-col gap-2 rounded-lg border p-2">
      {isMagnitude(checkin.status) && (
        <div className="grid grid-cols-3 gap-1.5">
          {MAGNITUDE_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                "rounded-md border py-1 text-xs font-semibold transition-colors",
                status === s
                  ? cn("bg-accent", STATUS_STYLE[s])
                  : "border-border text-muted-foreground",
              )}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      )}
      <Input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="メモ"
      />
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 />
          削除
        </Button>
        <div className="flex gap-1.5">
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
            <X />
            取消
          </Button>
          <Button size="sm" onClick={save}>
            <Check />
            保存
          </Button>
        </div>
      </div>
    </li>
  );
}
