import { useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import type { Checkin, Issue, MagnitudeStatus, Status } from "@/domain/types";
import { MAGNITUDE_STATUSES, isMagnitude } from "@/domain/types";
import { currentEpisodeDays, sortedCheckins } from "@/domain/episodes";
import { localDateKey, localTime, todayKey } from "@/domain/time";
import { STATUS_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DeleteIssueButton } from "@/components/DeleteIssueButton";

const STATUS_STYLE: Record<MagnitudeStatus, string> = {
  worse: "text-destructive border-destructive/40",
  same: "text-foreground",
  better: "text-primary border-primary/50",
};

/** 保存済みの1エントリ。既定は読み取り専用、鉛筆で編集モードに入る */
function CheckinRow({
  checkin,
  onEdit,
  onDelete,
}: {
  checkin: Checkin;
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

  if (!editing) {
    return (
      <li className="group flex items-start justify-between gap-2">
        <p className="text-sm leading-snug">
          <span className="text-muted-foreground text-xs tabular-nums">
            {localTime(checkin.at)}
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
      <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="メモ" />
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

export function SymptomCard({
  issue,
  now,
  onRecord,
  onResolve,
  onEditCheckin,
  onDeleteCheckin,
  onDeleteIssue,
}: {
  issue: Issue;
  now: Date;
  onRecord: (status: MagnitudeStatus | "memo", note: string) => void;
  onResolve: () => void;
  onEditCheckin: (checkinId: string, patch: Partial<Omit<Checkin, "id">>) => void;
  onDeleteCheckin: (checkinId: string) => void;
  onDeleteIssue: () => void;
}) {
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState<MagnitudeStatus | null>(null);
  const days = currentEpisodeDays(issue, now);
  const key = todayKey(now);
  const todays = sortedCheckins(issue).filter((c) => localDateKey(c.at) === key);

  const toggle = (s: MagnitudeStatus) =>
    setSelected((prev) => (prev === s ? null : s));

  const canSave = selected !== null || note.trim() !== "";
  const save = () => {
    if (!canSave) return;
    onRecord(selected ?? "memo", note.trim());
    setSelected(null);
    setNote("");
  };

  return (
    <Card className="gap-3 py-4">
      <CardContent className="flex flex-col gap-3 px-4">
        <div className="flex items-start justify-between gap-3">
          <span className="font-serif text-lg font-semibold">{issue.name}</span>
          <div className="flex shrink-0 items-center gap-2 pt-0.5">
            {days !== null && (
              <span className="text-muted-foreground text-xs tabular-nums">
                このぶり返し{" "}
                <span className="text-primary text-sm font-semibold">{days}</span>{" "}
                日目
              </span>
            )}
            <DeleteIssueButton name={issue.name} onDelete={onDeleteIssue} />
          </div>
        </div>

        {todays.length > 0 && (
          <div>
            <p className="text-muted-foreground mb-1 text-xs">今日の記録</p>
            <ul className="flex flex-col gap-1.5">
              {todays.map((c) => (
                <CheckinRow
                  key={c.id}
                  checkin={c}
                  onEdit={(patch) => onEditCheckin(c.id, patch)}
                  onDelete={() => onDeleteCheckin(c.id)}
                />
              ))}
            </ul>
          </div>
        )}

        <div className="border-border flex flex-col gap-2 border-t pt-3">
          <p className="text-muted-foreground text-xs">
            状態(選ばなければ「メモ」として記録)
          </p>
          <div className="grid grid-cols-3 gap-2">
            {MAGNITUDE_STATUSES.map((s) => {
              const on = selected === s;
              return (
                <button
                  key={s}
                  onClick={() => toggle(s)}
                  aria-pressed={on}
                  className={cn(
                    "rounded-md border py-2 text-sm font-semibold transition-colors",
                    on
                      ? cn("bg-accent", STATUS_STYLE[s])
                      : "border-border text-muted-foreground hover:bg-accent/50",
                  )}
                >
                  {STATUS_LABEL[s]}
                </button>
              );
            })}
          </div>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="メモ(任意)— 症状の様子や、出来事など"
            rows={2}
            className="min-h-16 bg-card"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground text-xs">
              {selected ? `${STATUS_LABEL[selected]} として記録` : "メモ として記録"}
            </span>
            <Button size="sm" disabled={!canSave} onClick={save}>
              <Check />
              保存
            </Button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onResolve}
            className="text-primary inline-flex items-center gap-1.5 text-sm font-medium underline-offset-2 hover:underline"
          >
            <span
              aria-hidden
              className="border-primary text-primary grid size-5 place-items-center rounded-full border font-serif text-[11px] font-bold"
              style={{ transform: "rotate(-8deg)" }}
            >
              治
            </span>
            治った記録にする
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
