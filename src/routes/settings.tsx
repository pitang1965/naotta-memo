import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAppData } from "@/hooks/useAppData";
import { addIssue, updateSettings } from "@/domain/operations";
import { BackupSection } from "@/components/BackupSection";
import { ProfileSection } from "@/components/ProfileSection";
import { CsvImport } from "@/components/CsvImport";
import { OtherApps } from "@/components/OtherApps";

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
    body = (
      <div className="flex flex-col gap-4">
        <ProfileSection
          birthDate={data.settings.birthDate}
          onSave={(bd) => update((d) => updateSettings(d, { birthDate: bd }))}
        />
        <CsvImport
          onImport={(issues) =>
            update((d) => issues.reduce((acc, i) => addIssue(acc, i), d))
          }
        />
        <BackupSection data={data} onReplace={(nd) => update(() => nd)} />
      </div>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 pt-6 pb-24">
      <header>
        <h1 className="font-serif text-lg font-semibold tracking-wide">設定</h1>
      </header>
      {body}
      <OtherApps />
      <footer className="text-muted-foreground border-border mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-4 text-xs">
        <Link to="/terms" className="hover:text-foreground hover:underline">
          利用規約
        </Link>
        <Link to="/privacy" className="hover:text-foreground hover:underline">
          プライバシーポリシー
        </Link>
      </footer>
    </main>
  );
}
