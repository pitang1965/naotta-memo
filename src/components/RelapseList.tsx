import type { Issue } from "@/domain/types";
import { deriveEpisodes } from "@/domain/episodes";
import { localDateKey } from "@/domain/time";
import { jpDate } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { DeleteIssueButton } from "@/components/DeleteIssueButton";
import { EventDateDialog } from "@/components/EventDateDialog";

/** 直近の(閉じた)エピソードの期間表示 */
function lastEpisodeSummary(issue: Issue): string | null {
  const eps = deriveEpisodes(issue);
  for (let i = eps.length - 1; i >= 0; i--) {
    const ep = eps[i];
    if (ep.closed && ep.endAt) {
      const from = jpDate(localDateKey(ep.startAt));
      const to = jpDate(localDateKey(ep.endAt));
      return `${from}〜${to}(${ep.durationDays}日間)`;
    }
  }
  return null;
}

export function RelapseList({
  resolved,
  now,
  onRelapse,
  onDelete,
}: {
  resolved: Issue[];
  now: Date;
  onRelapse: (issue: Issue, atISO: string) => void;
  onDelete: (issue: Issue) => void;
}) {
  if (resolved.length === 0) return null;

  return (
    <section>
      <h2 className="text-muted-foreground mb-2 text-sm font-medium">
        治った症状 — ぶり返したら選ぶ
      </h2>
      <ul className="flex flex-col gap-2">
        {resolved.map((issue) => (
          <li
            key={issue.id}
            className="bg-card border-border flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate font-serif text-sm font-semibold">
                {issue.name}
              </p>
              {lastEpisodeSummary(issue) && (
                <p className="text-muted-foreground text-xs tabular-nums">
                  {lastEpisodeSummary(issue)}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <EventDateDialog
                title="再発した日"
                description="いつぶり返しましたか?(過去の日も選べます)"
                confirmLabel="再発を記録"
                now={now}
                onConfirm={(at) => onRelapse(issue, at)}
                trigger={
                  <Button variant="outline" size="sm">
                    <RotateCcw />
                    再発
                  </Button>
                }
              />
              <DeleteIssueButton
                name={issue.name}
                onDelete={() => onDelete(issue)}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
