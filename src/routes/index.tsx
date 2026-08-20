import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { Issue, MagnitudeStatus } from "@/domain/types";
import { deriveStatus, latestCheckinAt } from "@/domain/episodes";
import { localDateKey, todayKey } from "@/domain/time";
import {
  addCheckin,
  addIssue,
  clearMood,
  createIssue,
  deleteCheckin,
  editCheckin,
  relapseIssue,
  removeIssue,
  replaceIssue,
  resolveIssue,
  upsertMood,
} from "@/domain/operations";
import { jpDate } from "@/lib/labels";
import { useAppData } from "@/hooks/useAppData";
import { MoodPicker } from "@/components/MoodPicker";
import { SymptomCard } from "@/components/SymptomCard";
import { AddSymptom } from "@/components/AddSymptom";
import { RelapseList } from "@/components/RelapseList";
import { VisitExport } from "@/components/VisitExport";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { data, error, update, ready } = useAppData();
  const now = new Date();
  const today = todayKey(now);

  if (error) {
    return (
      <Shell>
        <div className="border-destructive/40 bg-destructive/5 text-foreground rounded-xl border p-4 text-sm">
          <p className="text-destructive mb-1 font-semibold">
            保存データを読み込めませんでした
          </p>
          <p className="text-muted-foreground">
            データが壊れている可能性があります。上書きを避けるため、いまは読み込みを止めています。
            バックアップからの復元を検討してください。
          </p>
        </div>
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

  const active = data.issues.filter((i) => deriveStatus(i) === "active");
  const resolved = data.issues
    .filter((i) => deriveStatus(i) === "resolved")
    .sort((a, b) => (latestCheckinAt(a) < latestCheckinAt(b) ? 1 : -1));

  const mood = data.daily.find((d) => d.date === today)?.mood;
  const recordedToday =
    !!mood ||
    data.issues.some((i) =>
      i.checkins.some((c) => localDateKey(c.at) === today),
    );

  const onRecord = (
    issue: Issue,
    status: MagnitudeStatus | "memo",
    note: string,
  ) => update((d) => replaceIssue(d, addCheckin(issue, status, { note })));

  return (
    <Shell>
      {!recordedToday && (
        <p className="border-primary/30 bg-primary/5 text-foreground rounded-lg border px-3 py-2 text-sm">
          今日の記録はまだです。調子や続いている症状を、ひとつだけでも。
        </p>
      )}

      <MoodPicker
        current={mood}
        onPick={(m) => update((d) => upsertMood(d, today, m))}
        onClear={() => update((d) => clearMood(d, today))}
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-muted-foreground text-sm font-medium">
          続いている症状
        </h2>
        {active.length === 0 ? (
          <p className="text-muted-foreground bg-card border-border rounded-lg border border-dashed px-3 py-4 text-center text-sm">
            いまはありません。不調があれば、下から登録できます。
          </p>
        ) : (
          active.map((issue) => (
            <SymptomCard
              key={issue.id}
              issue={issue}
              now={now}
              onRecord={(status, note) => onRecord(issue, status, note)}
              onResolve={(at) =>
                update((d) => replaceIssue(d, resolveIssue(issue, at)))
              }
              onEditCheckin={(id, patch) =>
                update((d) => replaceIssue(d, editCheckin(issue, id, patch)))
              }
              onDeleteCheckin={(id) =>
                update((d) => replaceIssue(d, deleteCheckin(issue, id)))
              }
              onDeleteIssue={() => update((d) => removeIssue(d, issue.id))}
            />
          ))
        )}
        <AddSymptom
          now={now}
          onAdd={(name, note, at) =>
            update((d) => addIssue(d, createIssue(name, at, note)))
          }
        />
      </section>

      <RelapseList
        resolved={resolved}
        now={now}
        onRelapse={(issue, at) =>
          update((d) => replaceIssue(d, relapseIssue(issue, at)))
        }
        onDelete={(issue) => update((d) => removeIssue(d, issue.id))}
      />

      {data.issues.length > 0 && <VisitExport data={data} now={now} />}
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const now = new Date();
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-4 pt-6 pb-24">
      <header className="flex items-baseline justify-between">
        <h1 className="font-serif text-xl font-semibold tracking-wide">
          なおった<span className="text-primary">・</span>メモ
        </h1>
        <span className="text-muted-foreground text-xs tabular-nums">
          {jpDate(todayKey(now))}
        </span>
      </header>
      {children}
    </main>
  );
}
