import type { Mood } from "@/domain/types";
import { MOOD_OPTIONS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export function MoodPicker({
  current,
  onPick,
  onClear,
}: {
  current: Mood | undefined;
  onPick: (mood: Mood) => void;
  onClear: () => void;
}) {
  return (
    <Card className="gap-3 py-4">
      <CardContent className="px-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-serif text-base font-semibold tracking-wide">
            今日の調子
          </h2>
          {current && (
            <button
              className="text-muted-foreground hover:text-foreground text-xs underline-offset-2 hover:underline"
              onClick={onClear}
            >
              取り消す
            </button>
          )}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {MOOD_OPTIONS.map((o) => {
            const active = current === o.value;
            return (
              <button
                key={o.value}
                onClick={() => onPick(o.value)}
                aria-pressed={active}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border py-2.5 transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background hover:bg-accent text-foreground",
                )}
              >
                <span className="text-lg leading-none">{o.symbol}</span>
                <span className="text-xs">{o.text}</span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
