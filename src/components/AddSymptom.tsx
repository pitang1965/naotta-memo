import { useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function AddSymptom({
  onAdd,
}: {
  onAdd: (name: string, note: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");

  const reset = () => {
    setName("");
    setNote("");
    setOpen(false);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed, note.trim());
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
