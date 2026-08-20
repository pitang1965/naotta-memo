import type { Checkin, Issue } from "@/domain/types";
import {
  currentEpisodeDays,
  deriveEpisodes,
  deriveStatus,
  diseaseSpan,
} from "@/domain/episodes";
import { localDateKey } from "@/domain/time";
import { jpDate, jpDateFull } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { CheckinRow } from "@/components/CheckinRow";

export function IssueHistory({
  issue,
  now,
  onEditCheckin,
  onDeleteCheckin,
}: {
  issue: Issue;
  now: Date;
  onEditCheckin: (checkinId: string, patch: Partial<Omit<Checkin, "id">>) => void;
  onDeleteCheckin: (checkinId: string) => void;
}) {
  const active = deriveStatus(issue) === "active";
  const episodes = deriveEpisodes(issue);
  const span = diseaseSpan(issue, now);

  return (
    <details className="bg-card border-border group rounded-xl border">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-serif text-base font-semibold">
              {issue.name}
            </span>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                active
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {active ? "続いている" : "治った"}
            </span>
          </div>
          {span && (
            <p className="text-muted-foreground text-xs tabular-nums">
              {jpDateFull(span.fromKey)}から
              {span.intermittent ? "断続的" : "継続的"}・{span.episodeCount}回
            </p>
          )}
        </div>
        <span className="text-muted-foreground shrink-0 text-xs">
          <span className="group-open:hidden">開く</span>
          <span className="hidden group-open:inline">閉じる</span>
        </span>
      </summary>

      <div className="border-border flex flex-col gap-4 border-t px-4 py-3">
        {episodes.map((ep) => {
          const startKey = localDateKey(ep.startAt);
          const endKey = ep.endAt ? localDateKey(ep.endAt) : null;
          const dayNow = ep.closed ? null : currentEpisodeDays(issue, now);
          return (
            <div key={ep.index}>
              <p className="text-foreground mb-1.5 text-xs font-semibold">
                {ep.kind === "initial" ? "発症" : "再発"} {jpDate(startKey)}
                {ep.closed && endKey
                  ? ` 〜 治癒 ${jpDate(endKey)}(${ep.durationDays}日間)`
                  : dayNow !== null
                    ? ` 〜 継続中(${dayNow}日目)`
                    : ""}
              </p>
              <ul className="border-border ml-1 flex flex-col gap-1.5 border-l pl-3">
                {ep.checkins.map((c) => (
                  <CheckinRow
                    key={c.id}
                    checkin={c}
                    withDate
                    onEdit={(patch) => onEditCheckin(c.id, patch)}
                    onDelete={() => onDeleteCheckin(c.id)}
                  />
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </details>
  );
}
