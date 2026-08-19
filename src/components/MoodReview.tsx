import type { AppData, Mood } from "@/domain/types";
import { recentDayKeys } from "@/domain/time";
import { MOOD_LABEL, MOOD_OPTIONS, MOOD_SYMBOL, jpDate } from "@/lib/labels";
import { cn } from "@/lib/utils";

// 絶好調 → つらい を、緑→黄土→赤 の重症度ランプで。不調の連なりが赤で見える。
const MOOD_COLOR: Record<Mood, string> = {
  great: "bg-primary",
  ok: "bg-primary/45",
  meh: "bg-amber-400 dark:bg-amber-500/80",
  bad: "bg-destructive",
};

const STRIP_DAYS = 14;

export function MoodReview({ data, now }: { data: AppData; now: Date }) {
  const days = recentDayKeys(STRIP_DAYS, now);
  const byDate = new Map(data.daily.map((d) => [d.date, d.mood]));
  const recorded = [...data.daily].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="text-muted-foreground mb-2 text-sm font-medium">
          この2週間
        </h2>
        <div className="flex gap-1">
          {days.map((key) => {
            const m = byDate.get(key);
            return (
              <div
                key={key}
                title={`${jpDate(key)} ${m ? MOOD_LABEL[m] : "未記録"}`}
                className={cn(
                  "h-9 flex-1 rounded-sm",
                  m ? MOOD_COLOR[m] : "bg-muted",
                )}
              />
            );
          })}
        </div>
        <div className="text-muted-foreground mt-1 flex justify-between text-[11px] tabular-nums">
          <span>{jpDate(days[0])}</span>
          <span>今日</span>
        </div>
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
              <li
                key={d.date}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <span className="tabular-nums">{jpDate(d.date)}</span>
                <span className="inline-flex items-center gap-2">
                  <span
                    className={cn("size-3 rounded-sm", MOOD_COLOR[d.mood])}
                  />
                  <span className="font-medium">
                    {MOOD_SYMBOL[d.mood]} {MOOD_LABEL[d.mood]}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
