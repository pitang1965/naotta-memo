import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useAppData } from "@/hooks/useAppData";
import { BackupSection } from "@/components/BackupSection";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { data, error, ready, update } = useAppData();

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
    body = <BackupSection data={data} onReplace={(nd) => update(() => nd)} />;
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 pt-6 pb-24">
      <header>
        <h1 className="font-serif text-lg font-semibold tracking-wide">設定</h1>
      </header>
      {body}
    </main>
  );
}
