import { addDays, todayKey } from "@/domain/time";
import { cn } from "@/lib/utils";

/** 今日/昨日のクイック選択＋日付入力。value/onChange はローカル YYYY-MM-DD */
export function DateChoice({
  value,
  onChange,
  now,
}: {
  value: string;
  onChange: (key: string) => void;
  now: Date;
}) {
  const today = todayKey(now);
  const yesterday = addDays(today, -1);

  const chip = (key: string, label: string) => (
    <button
      type="button"
      onClick={() => onChange(key)}
      aria-pressed={value === key}
      className={cn(
        "rounded-md border px-3 py-1.5 text-sm transition-colors",
        value === key
          ? "border-primary bg-primary/10 text-primary font-medium"
          : "border-border text-muted-foreground hover:bg-accent/50",
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chip(today, "今日")}
      {chip(yesterday, "昨日")}
      <input
        type="date"
        value={value}
        max={today}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className="border-border bg-background text-foreground h-9 rounded-md border px-3 text-sm"
      />
    </div>
  );
}
