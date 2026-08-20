import { useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import type { AppData, Mood } from "@/domain/types";
import { recentDayKeys } from "@/domain/time";
import { MOOD_LABEL, MOOD_OPTIONS, MOOD_SYMBOL, jpDate } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// 絶好調 → つらい を、緑→黄土→赤 の重症度ランプで。不調の連なりが赤で見える。
const MOOD_COLOR: Record<Mood, string> = {
  great: "bg-primary",
  ok: "bg-primary/45",
  meh: "bg-amber-400 dark:bg-amber-500/80",
  bad: "bg-destructive",
};

const RANGE_OPTIONS: { label: string; days: number }[] = [
  { label: "2週間", days: 14 },
  { label: "1ヶ月", days: 30 },
  { label: "3ヶ月", days: 90 },
];

export function MoodReview({
  data,
  now,
  onSet,
  onClear,
}: {
  data: AppData;
  now: Date;
  onSet: (date: string, mood: Mood) => void;
  onClear: (date: string) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [rangeDays, setRangeDays] = useState(14);
  const days = recentDayKeys(rangeDays, now);
  const gap = rangeDays <= 14 ? "gap-1" : rangeDays <= 30 ? "gap-0.5" : "gap-px";
  const byDate = new Map(data.daily.map((d) => [d.date, d.mood]));
  const recorded = [...data.daily].sort((a, b) => (a.date < b.date ? 1 : -1));
  const editingMood = editing !== null ? byDate.get(editing) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-muted-foreground text-sm font-medium">
            調子の推移
          </h2>
          <div className="flex gap-1">
            {RANGE_OPTIONS.map((o) => (
              <button
                key={o.days}
                onClick={() => setRangeDays(o.days)}
                aria-pressed={rangeDays === o.days}
                className={cn(
                  "rounded-md border px-2 py-0.5 text-xs transition-colors",
                  rangeDays === o.days
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border text-muted-foreground hover:bg-accent/50",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className={cn("flex", gap)}>
          {days.map((key) => {
            const m = byDate.get(key);
            return (
              <button
                key={key}
                onClick={() => setEditing(key)}
                title={`${jpDate(key)} ${m ? MOOD_LABEL[m] : "未記録"}`}
                aria-label={`${jpDate(key)} の調子を記録`}
                className={cn(
                  "h-9 flex-1 rounded-sm",
                  m ? MOOD_COLOR[m] : "bg-muted hover:bg-muted-foreground/30",
                  editing === key &&
                    "ring-primary ring-offset-background ring-2 ring-offset-2",
                )}
              />
            );
          })}
        </div>
        <div className="text-muted-foreground mt-1 flex justify-between text-[11px] tabular-nums">
          <span>{jpDate(days[0])}</span>
          <span>今日</span>
        </div>

        {editing !== null && (
          <div className="border-border bg-card mt-3 flex flex-col gap-2 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium tabular-nums">
                {jpDate(editing)} の調子
              </span>
              <button
                onClick={() => setEditing(null)}
                aria-label="閉じる"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {MOOD_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => {
                    onSet(editing, o.value);
                    setEditing(null);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border py-2 transition-colors",
                    editingMood === o.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-foreground hover:bg-accent",
                  )}
                >
                  <span className="text-lg leading-none">{o.symbol}</span>
                  <span className="text-xs">{o.text}</span>
                </button>
              ))}
            </div>
            {editingMood && (
              <Button
                variant="ghost"
                size="sm"
                className="self-start"
                onClick={() => {
                  onClear(editing);
                  setEditing(null);
                }}
              >
                <Trash2 />
                この日を削除
              </Button>
            )}
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {MOOD_OPTIONS.map((o) => (
            <span
              key={o.value}
              className="text-muted-foreground inline-flex items-center gap-1.5"
            >
              <span className={cn("size-3 rounded-sm", MOOD_COLOR[o.value])} />
              {o.symbol} {o.text}
            </span>
          ))}
        </div>
        <p className="text-muted-foreground mt-2 text-xs">
          マスをタップすると、その日の調子を記録・修正できます(過去の日も)。
        </p>
      </section>

      <section>
        <h2 className="text-muted-foreground mb-2 text-sm font-medium">記録</h2>
        {recorded.length === 0 ? (
          <p className="text-muted-foreground bg-card border-border rounded-lg border border-dashed px-3 py-6 text-center text-sm">
            まだ「今日の調子」の記録がありません。
          </p>
        ) : (
          <ul className="divide-border flex flex-col divide-y">
            {recorded.map((d) => (
              <li key={d.date}>
                <button
                  onClick={() => setEditing(d.date)}
                  className="hover:bg-accent/40 flex w-full items-center justify-between rounded-md px-1 py-2.5 text-sm transition-colors"
                >
                  <span className="tabular-nums">{jpDate(d.date)}</span>
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={cn("size-3 rounded-sm", MOOD_COLOR[d.mood])}
                    />
                    <span className="font-medium">
                      {MOOD_SYMBOL[d.mood]} {MOOD_LABEL[d.mood]}
                    </span>
                    <Pencil className="text-muted-foreground size-3.5" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
