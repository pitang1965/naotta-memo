import { useState } from "react";
import { Trash2, X } from "lucide-react";
import type { AppData, Mood } from "@/domain/types";
import { recentDayKeys } from "@/domain/time";
import { trendRows } from "@/domain/trend";
import { MOOD_LABEL, MOOD_OPTIONS, jpDate } from "@/lib/labels";
import { MOOD_COLOR } from "@/lib/mood";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MoodFace } from "@/components/MoodFace";
import { SymptomLegend, SymptomTrendRow } from "@/components/SymptomTrend";

const RANGE_OPTIONS: { label: string; days: number }[] = [
  { label: "2週間", days: 14 },
  { label: "1ヶ月", days: 30 },
  { label: "3ヶ月", days: 90 },
];

/**
 * 推移(CONTEXT「推移」)。調子と各症状を同じ日付軸に並べて見渡す。
 * 調子のマスはここで記録・修正する(過去日の調子の置き場はここだけ)。
 * 症状のマスは見るだけで、直すのは履歴で行う。
 */
export function TrendReview({
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
  const [selected, setSelected] = useState<{
    issueId: string;
    date: string;
  } | null>(null);
  const [rangeDays, setRangeDays] = useState(14);
  const days = recentDayKeys(rangeDays, now);
  const gap =
    rangeDays <= 14 ? "gap-1" : rangeDays <= 30 ? "gap-0.5" : "gap-px";
  const showIcons = rangeDays <= 14;
  const rows = trendRows(data.issues, days);
  const byDate = new Map(data.daily.map((d) => [d.date, d.mood]));
  const editingMood = editing !== null ? byDate.get(editing) : undefined;

  // 開いておくパネルは1つだけ(調子の編集と症状の詳細を同時に開かない)
  const editMood = (date: string) => {
    setSelected(null);
    setEditing(date);
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4">
        <div className="flex justify-end gap-1">
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

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <span className="text-foreground font-medium">調子</span>
            {MOOD_OPTIONS.map((o) => (
              <span
                key={o.value}
                className="text-muted-foreground inline-flex items-center gap-1.5"
              >
                <span
                  className={cn("size-3 rounded-sm", MOOD_COLOR[o.value])}
                />
                {o.symbol} {o.text}
              </span>
            ))}
          </div>
          {rows.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span className="text-foreground font-medium">症状</span>
              <SymptomLegend />
            </div>
          )}
        </div>
        <div>
          <h2 className="mb-1 text-xs font-medium">調子</h2>
          <div className={cn("flex", gap)}>
            {days.map((key) => {
              const m = byDate.get(key);
              return (
                <button
                  key={key}
                  onClick={() => editMood(key)}
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
                      "text-foreground flex flex-col items-center gap-1 rounded-lg border py-2 transition-colors",
                      editingMood === o.value
                        ? "border-primary bg-primary/10 font-medium"
                        : "border-border hover:bg-accent",
                    )}
                  >
                    <MoodFace mood={o.value} className="size-7" />
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
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="sr-only">症状</h2>
          {rows.length === 0 ? (
            <p className="text-muted-foreground border-border rounded-lg border border-dashed px-3 py-4 text-center text-xs">
              この期間に記録された症状はありません。
            </p>
          ) : (
            rows.map((row) => (
              <SymptomTrendRow
                key={row.issue.id}
                row={row}
                gap={gap}
                showIcons={showIcons}
                selectedDate={
                  selected?.issueId === row.issue.id ? selected.date : null
                }
                onSelect={(date) => {
                  setEditing(null);
                  setSelected(date ? { issueId: row.issue.id, date } : null);
                }}
              />
            ))
          )}
        </div>

        <div className="text-muted-foreground -mt-2 flex justify-between text-[11px] tabular-nums">
          <span>{jpDate(days[0])}</span>
          <span>今日</span>
        </div>

        <p className="text-muted-foreground text-xs">
          調子のマスをタップすると、その日の調子を記録・修正できます(過去の日も)。症状のマスをタップすると、その日の記録が見られます。
        </p>
      </section>
    </div>
  );
}
