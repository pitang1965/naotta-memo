import { addDays, todayKey } from "@/domain/time";
import { cn } from "@/lib/utils";

/** 今日/昨日のクイック選択＋日付入力。value/onChange はローカル YYYY-MM-DD。
 *  onUnknown を渡すと末尾に [わからない] が並び、選ばれている間は日付側の選択を外す。 */
export function DateChoice({
  value,
  onChange,
  now,
  unknown = false,
  onUnknown,
}: {
  value: string;
  onChange: (key: string) => void;
  now: Date;
  unknown?: boolean;
  onUnknown?: () => void;
}) {
  const today = todayKey(now);
  const yesterday = addDays(today, -1);

  const chip = (label: string, pressed: boolean, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={cn(
        "rounded-md border px-3 py-1.5 text-sm transition-colors",
        pressed
          ? "border-primary bg-primary/10 text-primary font-medium"
          : "border-border text-muted-foreground hover:bg-accent/50",
      )}
    >
      {label}
    </button>
  );

  const dayChip = (key: string, label: string) =>
    chip(label, !unknown && value === key, () => onChange(key));

  return (
    <div className="flex flex-wrap items-center gap-2">
      {dayChip(today, "今日")}
      {dayChip(yesterday, "昨日")}
      <input
        type="date"
        value={value}
        max={today}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className={cn(
          "border-border bg-background text-foreground h-9 rounded-md border px-3 text-sm",
          unknown && "text-muted-foreground",
        )}
      />
      {onUnknown && chip("わからない", unknown, onUnknown)}
    </div>
  );
}
