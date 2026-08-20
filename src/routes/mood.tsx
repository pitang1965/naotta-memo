import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useAppData } from "@/hooks/useAppData";
import { clearMood, upsertMood } from "@/domain/operations";
import { MoodReview } from "@/components/MoodReview";

export const Route = createFileRoute("/mood")({
  component: MoodPage,
});

function MoodPage() {
  const { data, error, ready, update } = useAppData();
  const now = new Date();

  let body: ReactNode;
  if (error) {
    body = (
      <p className="text-muted-foreground text-sm">
        保存データを読み込めませんでした。
      </p>
    );
  } else if (!ready || !data) {
    body = <p className="text-muted-foreground text-sm">読み込み中…</p>;
  } else {
    body = (
      <MoodReview
        data={data}
        now={now}
        onSet={(date, mood) => update((d) => upsertMood(d, date, mood))}
        onClear={(date) => update((d) => clearMood(d, date))}
      />
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 pt-6 pb-24">
      <header>
        <h1 className="font-serif text-lg font-semibold tracking-wide">
          調子の記録
        </h1>
      </header>
      {body}
    </main>
  );
}
