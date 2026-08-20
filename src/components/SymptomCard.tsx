import { useState } from "react";
import { Check } from "lucide-react";
import type { Checkin, Issue, MagnitudeStatus } from "@/domain/types";
import { MAGNITUDE_STATUSES } from "@/domain/types";
import { currentEpisodeDays, sortedCheckins } from "@/domain/episodes";
import { localDateKey, todayKey } from "@/domain/time";
import { STATUS_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CheckinRow } from "@/components/CheckinRow";
import { DeleteIssueButton } from "@/components/DeleteIssueButton";
import { EventDateDialog } from "@/components/EventDateDialog";

const STATUS_STYLE: Record<MagnitudeStatus, string> = {
  worse: "text-destructive border-destructive/40",
  same: "text-foreground",
  better: "text-primary border-primary/50",
};

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
  onResolve: (atISO: string) => void;
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
          <EventDateDialog
            title="治った日"
            description="いつ治りましたか?(過去の日も選べます)"
            confirmLabel="治ったことにする"
            now={now}
            onConfirm={onResolve}
            trigger={
              <button className="text-primary inline-flex items-center gap-1.5 text-sm font-medium underline-offset-2 hover:underline">
                <span
                  aria-hidden
                  className="border-primary text-primary grid size-5 place-items-center rounded-full border font-serif text-[11px] font-bold"
                  style={{ transform: "rotate(-8deg)" }}
                >
                  治
                </span>
                治った記録にする
              </button>
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
