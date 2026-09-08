import type { Issue } from "@/domain/types";
import { localDateKey } from "@/domain/time";
import { jpDate } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Undo2 } from "lucide-react";
import { DeleteIssueButton } from "@/components/DeleteIssueButton";

/**
 * 「気にしない」ことにした症状。治ってはいないので「治った症状」には混ぜず、
 * 今日タブの末尾に畳んで置く。また気になったら戻せる。
 */
export function DismissedList({
  dismissed,
  onRestore,
  onDelete,
}: {
  dismissed: Issue[];
  onRestore: (issue: Issue) => void;
  onDelete: (issue: Issue) => void;
}) {
  if (dismissed.length === 0) return null;

  return (
    <details className="group">
      <summary className="text-muted-foreground flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium">
        気にしない症状（{dismissed.length}）
        <span className="text-xs group-open:hidden">開く</span>
        <span className="hidden text-xs group-open:inline">閉じる</span>
      </summary>
      <ul className="mt-2 flex flex-col gap-2">
        {dismissed.map((issue) => (
          <li
            key={issue.id}
            className="bg-card border-border flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate font-serif text-sm font-semibold">
                {issue.name}
              </p>
              {issue.dismissedAt && (
                <p className="text-muted-foreground text-xs tabular-nums">
                  {jpDate(localDateKey(issue.dismissedAt))}から
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRestore(issue)}
              >
                <Undo2 />
                また記録する
              </Button>
              <DeleteIssueButton
                name={issue.name}
                onDelete={() => onDelete(issue)}
              />
            </div>
          </li>
        ))}
      </ul>
    </details>
  );
}
