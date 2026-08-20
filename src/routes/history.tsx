import type { ReactNode } from "react";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useAppData } from "@/hooks/useAppData";
import { latestCheckinAt } from "@/domain/episodes";
import {
  deleteCheckin,
  deleteCheckinsOnDate,
  editCheckin,
  replaceIssue,
} from "@/domain/operations";
import { Input } from "@/components/ui/input";
import { IssueHistory } from "@/components/IssueHistory";

export const Route = createFileRoute("/history")({
  component: History,
});

function History() {
  const { data, error, ready, update } = useAppData();
  const [q, setQ] = useState("");
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

  const query = q.trim().toLowerCase();
  const issues = data.issues
    .filter((i) => {
      if (!query) return true;
      if (i.name.toLowerCase().includes(query)) return true;
      return i.checkins.some((c) => c.note.toLowerCase().includes(query));
    })
    .sort((a, b) => (latestCheckinAt(a) < latestCheckinAt(b) ? 1 : -1));

  return (
    <Shell>
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="症状名・メモを検索"
        className="bg-card"
      />

      {data.issues.length === 0 ? (
        <p className="text-muted-foreground bg-card border-border rounded-lg border border-dashed px-3 py-6 text-center text-sm">
          まだ記録がありません。
        </p>
      ) : issues.length === 0 ? (
        <p className="text-muted-foreground px-1 text-sm">
          「{q}」に一致する記録はありません。
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {issues.map((issue) => (
            <IssueHistory
              key={issue.id}
              issue={issue}
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
