import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { X } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { useAppData } from "@/hooks/useAppData";
import { searchHistory } from "@/domain/historySearch";
import {
  deleteCheckin,
  deleteCheckinsOnDate,
  editCheckin,
  removeIssue,
  renameIssue,
  replaceIssue,
  updateSettings,
} from "@/domain/operations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IssueHistory } from "@/components/IssueHistory";

export const Route = createFileRoute("/history")({
  component: History,
});

function History() {
  const { data, error, ready, update } = useAppData();
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const now = new Date();

  if (error) {
    return (
      <Shell>
        <p className="text-muted-foreground text-sm">
          保存データを読み込めませんでした。
        </p>
      </Shell>
    );
  }
  if (!ready || !data) {
    return (
      <Shell>
        <p className="text-muted-foreground text-sm">読み込み中…</p>
      </Shell>
    );
  }

  const dateRange = { from, to };
  const invalidRange = !!from && !!to && from > to;
  const order = data.settings.historySortOrder ?? "newest";
  const issues = searchHistory(data.issues, q, dateRange, order);

  return (
    <Shell>
      <div className="flex items-center gap-2">
        <Input
          ref={searchRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="症状名・メモを検索"
          aria-label="症状名・メモを検索"
          className="bg-card"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="検索をクリア"
          disabled={q.length === 0}
          onClick={() => {
            setQ("");
            searchRef.current?.focus();
          }}
        >
          <X aria-hidden="true" />
        </Button>
      </div>

      <fieldset className="flex min-w-0 flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">記録日の範囲</legend>
        <div className="grid grid-cols-2 gap-2">
          <label className="min-w-0 text-sm">
            開始日
            <Input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => setFrom(e.target.value)}
              aria-invalid={invalidRange}
              aria-describedby={
                invalidRange ? "history-range-error" : undefined
              }
              className="bg-card mt-1 min-w-0"
            />
          </label>
          <label className="min-w-0 text-sm">
            終了日
            <Input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => setTo(e.target.value)}
              aria-invalid={invalidRange}
              aria-describedby={
                invalidRange ? "history-range-error" : undefined
              }
              className="bg-card mt-1 min-w-0"
            />
          </label>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-muted-foreground text-xs">
            片方だけでも指定できます。当日を含みます。
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!from && !to}
            onClick={() => {
              setFrom("");
              setTo("");
            }}
          >
            期間をクリア
          </Button>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs">
          {from || to ? "期間内の最新記録日" : "最新記録日"}
        </span>
        <div role="group" aria-label="履歴の並び順" className="flex gap-1">
          {(
            [
              ["newest", "新しい順"],
              ["oldest", "古い順"],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={order === value ? "secondary" : "ghost"}
              aria-pressed={order === value}
              onClick={() =>
                update((d) => updateSettings(d, { historySortOrder: value }))
              }
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {invalidRange ? (
        <p
          id="history-range-error"
          role="alert"
          className="text-destructive text-sm"
        >
          終了日は開始日以降にしてください。
        </p>
      ) : data.issues.length === 0 ? (
        <p className="text-muted-foreground bg-card border-border rounded-lg border border-dashed px-3 py-6 text-center text-sm">
          まだ記録がありません。
        </p>
      ) : issues.length === 0 ? (
        <p className="text-muted-foreground px-1 text-sm">
          指定した検索条件に一致する記録はありません。
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {issues.map(({ issue, latestAt, recordCount }) => (
            <IssueHistory
              key={issue.id}
              issue={issue}
              dateRange={dateRange}
              latestAt={latestAt}
              recordCount={recordCount}
              now={now}
              onEditCheckin={(cid, patch) =>
                update((d) => replaceIssue(d, editCheckin(issue, cid, patch)))
              }
              onDeleteCheckin={(cid) =>
                update((d) => replaceIssue(d, deleteCheckin(issue, cid)))
              }
              onDeleteDay={(dateKey) =>
                update((d) =>
                  replaceIssue(d, deleteCheckinsOnDate(issue, dateKey)),
                )
              }
              onRename={(name) =>
                update((d) => replaceIssue(d, renameIssue(issue, name)))
              }
              onDeleteIssue={() => update((d) => removeIssue(d, issue.id))}
            />
          ))}
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 pt-6 pb-24">
      <header>
        <h1 className="font-serif text-lg font-semibold tracking-wide">履歴</h1>
      </header>
      {children}
    </main>
  );
}
