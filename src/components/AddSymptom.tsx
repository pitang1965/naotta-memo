import { useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
import { atForDateKey, todayKey } from "@/domain/time";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DateChoice } from "@/components/DateChoice";

export function AddSymptom({
  now,
  onAdd,
}: {
  now: Date;
  onAdd: (name: string, note: string, atISO: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [onsetKey, setOnsetKey] = useState(() => todayKey(now));

  const reset = () => {
    setName("");
    setNote("");
    setOnsetKey(todayKey(now));
    setOpen(false);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed, note.trim(), atForDateKey(onsetKey, now));
    reset();
  };

  if (!open) {
    return (
      <Button
        variant="outline"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        <Plus />
        症状を登録
      </Button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="bg-card border-border flex flex-col gap-2 rounded-xl border p-4"
    >
      <p className="text-muted-foreground text-xs">新しい症状</p>
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="症状名(例: 頭痛、右ひざの痛み)"
      />
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="メモ(任意)— 発症時の様子など"
        rows={2}
        className="min-h-16"
      />
      <div className="flex flex-col gap-1.5">
        <span className="text-muted-foreground text-xs">発症日</span>
        <DateChoice value={onsetKey} onChange={setOnsetKey} now={now} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={reset}>
          <X />
          キャンセル
        </Button>
        <Button type="submit" disabled={!name.trim()}>
          <Plus />
          保存
        </Button>
      </div>
    </form>
  );
}
