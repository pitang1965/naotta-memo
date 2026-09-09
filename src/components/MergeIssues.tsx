import { useState } from "react";
import type { Issue } from "@/domain/types";
import { latestCheckinAt } from "@/domain/episodes";
import { localDateKey } from "@/domain/time";
import { jpDateFull } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function MergeIssues({
  issues,
  onMerge,
}: {
  issues: Issue[];
  onMerge: (ids: string[], name: string) => void;
}) {
  const [selecting, setSelecting] = useState(false);
  const [ids, setIds] = useState<string[]>([]);
  const [name, setName] = useState("");
  const selected = issues.filter((issue) => ids.includes(issue.id));
  const reset = () => {
    setSelecting(false);
    setIds([]);
    setName("");
  };

  if (!selecting)
    return (
      <Button
        variant="outline"
        disabled={issues.length < 2}
        onClick={() => setSelecting(true)}
      >
        同じ症状をまとめる
      </Button>
    );

  return (
    <section
      aria-label="同じ症状をまとめる"
      className="bg-card border-border flex flex-col gap-3 rounded-xl border p-4"
    >
      <p className="text-sm">
        同じ症状の再発としてまとめるものを2件以上選んでください。
      </p>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          setIds(issues.map((issue) => issue.id));
          if (!name) setName(issues[0]?.name ?? "");
        }}
      >
        検索結果をすべて選択
      </Button>
      <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
        {issues.map((issue) => {
          const latest = latestCheckinAt(issue);
          return (
            <label
              key={issue.id}
              className="flex items-start gap-2 rounded border p-2 text-sm"
            >
              <input
                type="checkbox"
                className="mt-1 size-4 shrink-0"
                checked={ids.includes(issue.id)}
                onChange={(e) => {
                  setIds(
                    e.target.checked
                      ? [...ids, issue.id]
                      : ids.filter((id) => id !== issue.id),
                  );
                  if (e.target.checked && !name) setName(issue.name);
                }}
              />
              <span className="min-w-0 break-words">
                {issue.name}
                <span className="text-muted-foreground block text-xs">
                  全{issue.checkins.length}件
                  {latest && `・最新記録 ${jpDateFull(localDateKey(latest))}`}
                </span>
              </span>
            </label>
          );
        })}
      </div>
      <label className="text-sm">
        まとめた後の症状名
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1"
        />
      </label>
      <p className="text-muted-foreground text-xs">
        選んだ症状の全期間の記録をまとめます。日時・メモは残し、2回目以降の発症は再発に変更します。現在の状態は最新の発症・再発・治癒の記録で決まります。
      </p>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={reset}>
          キャンセル
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={selected.length < 2 || !name.trim()}>
              {selected.length}件をまとめる
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                「{name.trim()}」にまとめますか？
              </AlertDialogTitle>
              <AlertDialogDescription>
                {selected.length}件の症状の全
                {selected.reduce(
                  (sum, issue) => sum + issue.checkins.length,
                  0,
                )}
                件の記録を一つにまとめます。統合後は元の症状ごとに分け直すことはできません。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>戻る</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  onMerge(
                    selected.map((issue) => issue.id),
                    name,
                  );
                  reset();
                }}
              >
                まとめる
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </section>
  );
}
