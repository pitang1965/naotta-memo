import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Minus, ThumbsDown, ThumbsUp, Triangle, X } from "lucide-react";
import type { MagnitudeStatus } from "@/domain/types";
import type { TrendDay, TrendRow } from "@/domain/trend";
import { localTime } from "@/domain/time";
import { STATUS_LABEL, jpDate } from "@/lib/labels";
import { cn } from "@/lib/utils";

// 強さは前回比なので水準としては描かず、色は「その日の向き」だけを表す。
// 悪化=朱・改善=緑は今日タブのボタンと同じ。赤と緑は見分けにくい人もいるので、
// マスが広い(2週間)ときはアイコンの形でも区別する。
const MAGNITUDE_COLOR: Record<MagnitudeStatus, string> = {
  worse: "bg-destructive text-primary-foreground",
  same: "bg-muted-foreground/45 text-foreground",
  better: "bg-primary text-primary-foreground",
};
const ONGOING_COLOR = "bg-destructive/20";
const IDLE_COLOR = "bg-muted";

const MAGNITUDE_ICON: Record<MagnitudeStatus, typeof ThumbsUp> = {
  worse: ThumbsDown,
  same: Minus,
  better: ThumbsUp,
};

function cellColor(d: TrendDay): string {
  if (d.magnitude) return MAGNITUDE_COLOR[d.magnitude];
  return d.ongoing ? ONGOING_COLOR : IDLE_COLOR;
}

/** マスの読み上げ・ツールチップ用の一言 */
function describeDay(d: TrendDay): string {
  const parts: string[] = [];
  if (d.onset) parts.push("発症・再発");
  if (d.magnitude) parts.push(STATUS_LABEL[d.magnitude]);
  if (d.resolved === "known") parts.push("治った");
  if (d.resolved === "unknown") parts.push("治った(日付不明)");
  if (parts.length === 0) parts.push(d.ongoing ? "続いていた" : "記録なし");
  return parts.join("・");
}

function UnknownResolvedMark() {
  return (
    <span className="border-muted-foreground bg-background inline-flex size-3 items-center justify-center rounded-full border border-dashed">
      <Check className="text-muted-foreground size-2" strokeWidth={3} />
    </span>
  );
}

/** 節目の印(マスの上の細い帯に置く。狭いマスでははみ出してよい) */
function Milestone({ day }: { day: TrendDay }) {
  if (day.resolved === "known")
    return <Check className="text-primary size-3" strokeWidth={3} />;
  if (day.resolved === "unknown") return <UnknownResolvedMark />;
  if (day.onset)
    return <Triangle className="text-destructive size-2.5 fill-current" />;
  return null;
}

export function SymptomTrendRow({
  row,
  gap,
  showIcons,
  selectedDate,
  onSelect,
}: {
  row: TrendRow;
  gap: string;
  showIcons: boolean;
  selectedDate: string | null;
  onSelect: (date: string | null) => void;
}) {
  const { issue, days } = row;
  const selected = days.find((d) => d.date === selectedDate) ?? null;

  return (
    <div>
      <div className="mb-0.5 flex items-center gap-2 text-xs">
        <span
          className={cn(
            "truncate font-medium",
            issue.dismissedAt && "text-muted-foreground",
          )}
        >
          {issue.name}
        </span>
        {issue.dismissedAt && (
          <span className="bg-muted text-muted-foreground shrink-0 rounded-full px-1.5 text-[10px]">
            気にしない
          </span>
        )}
      </div>
      <div className={cn(issue.dismissedAt && "opacity-50")}>
        <div className={cn("flex h-3.5", gap)} aria-hidden="true">
          {days.map((d) => (
            <div
              key={d.date}
              className="relative flex flex-1 items-end justify-center"
            >
              <span className="absolute bottom-0.5">
                <Milestone day={d} />
              </span>
            </div>
          ))}
        </div>
        <div className={cn("flex", gap)}>
          {days.map((d) => {
            const Icon = d.magnitude ? MAGNITUDE_ICON[d.magnitude] : null;
            return (
              <button
                key={d.date}
                onClick={() =>
                  onSelect(selectedDate === d.date ? null : d.date)
                }
                title={`${jpDate(d.date)} ${describeDay(d)}`}
                aria-label={`${jpDate(d.date)} ${issue.name}:${describeDay(d)}`}
                className={cn(
                  "relative flex h-7 flex-1 items-center justify-center rounded-sm",
                  cellColor(d),
                  selectedDate === d.date &&
                    "ring-primary ring-offset-background ring-2 ring-offset-2",
                )}
              >
                {showIcons && Icon && <Icon className="size-3.5" />}
                {showIcons && d.multipleMagnitudes && (
                  <span className="bg-background absolute top-0.5 right-0.5 size-1 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <DayDetail
          name={issue.name}
          day={selected}
          onClose={() => onSelect(null)}
        />
      )}
    </div>
  );
}

/** その日の全エントリ(読み取り専用)。直すのは履歴で行う */
function DayDetail({
  name,
  day,
  onClose,
}: {
  name: string;
  day: TrendDay;
  onClose: () => void;
}) {
  return (
    <div className="border-border bg-card mt-3 flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium tabular-nums">
          {jpDate(day.date)} の{name}
        </span>
        <button
          onClick={onClose}
          aria-label="閉じる"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
      {day.checkins.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          記録はありません{day.ongoing && "(症状は続いていました)"}。
        </p>
      ) : (
        <ul className="border-border ml-1 flex flex-col gap-1.5 border-l pl-3">
          {day.checkins.map((c) => (
            <li key={c.id} className="text-sm leading-snug">
              {!c.resolvedDateUnknown && (
                <span className="text-muted-foreground text-xs tabular-nums">
                  {localTime(c.at)}{" "}
                </span>
              )}
              <span className="font-medium">
                {STATUS_LABEL[c.status]}
                {c.resolvedDateUnknown && "(日付不明)"}
              </span>
              {c.note && (
                <span className="text-muted-foreground"> ・{c.note}</span>
              )}
            </li>
          ))}
        </ul>
      )}
      {day.resolved === "unknown" && (
        <p className="text-muted-foreground text-xs">
          治った日は不明です。この日より後のどこかで治りました。
        </p>
      )}
      {day.checkins.length > 0 && (
        <Link
          to="/history"
          search={{ q: name, from: day.date, to: day.date }}
          className="text-primary self-start text-sm font-medium underline-offset-4 hover:underline"
        >
          履歴で開く(訂正はこちら)
        </Link>
      )}
    </div>
  );
}

function LegendItem({
  swatch,
  children,
}: {
  swatch: ReactNode;
  children: ReactNode;
}) {
  return (
    <span className="text-muted-foreground inline-flex items-center gap-1.5">
      {swatch}
      {children}
    </span>
  );
}

export function SymptomLegend() {
  const box = (color: string, Icon?: typeof ThumbsUp) => (
    <span
      className={cn(
        "inline-flex size-3.5 items-center justify-center rounded-sm",
        color,
      )}
    >
      {Icon && <Icon className="size-2.5" />}
    </span>
  );
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
      <LegendItem swatch={box(ONGOING_COLOR)}>続いていた</LegendItem>
      <LegendItem swatch={box(MAGNITUDE_COLOR.worse, ThumbsDown)}>
        悪化
      </LegendItem>
      <LegendItem swatch={box(MAGNITUDE_COLOR.same, Minus)}>
        変わらず
      </LegendItem>
      <LegendItem swatch={box(MAGNITUDE_COLOR.better, ThumbsUp)}>
        改善
      </LegendItem>
      <LegendItem
        swatch={<Triangle className="text-destructive size-2.5 fill-current" />}
      >
        発症・再発
      </LegendItem>
      <LegendItem
        swatch={<Check className="text-primary size-3" strokeWidth={3} />}
      >
        治った
      </LegendItem>
      <LegendItem swatch={<UnknownResolvedMark />}>治った日不明</LegendItem>
    </div>
  );
}
