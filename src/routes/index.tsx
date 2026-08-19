import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-serif text-3xl font-semibold tracking-wide">
        なおった<span className="text-primary">・</span>メモ
      </h1>
      <p className="text-muted-foreground text-sm leading-relaxed">
        症状のはじまりから「治った」まで、ワンタップで記録。
        <br />
        —— ただいま製作中です。
      </p>
      <span className="border-border text-muted-foreground rounded-full border px-3 py-1 text-xs">
        Phase 1 土台構築中
      </span>
    </main>
  );
}
