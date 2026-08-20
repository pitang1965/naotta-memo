import { useState, type ReactNode } from "react";
import { atForDateKey, todayKey } from "@/domain/time";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DateChoice } from "@/components/DateChoice";

/**
 * 日付を選んで確定する小さなダイアログ。治癒日・再発日など「いつ起きたか」を選ぶ用途。
 * trigger をそのまま開くボタンにする。onConfirm には選んだ日の ISO を渡す。
 */
export function EventDateDialog({
  title,
  description,
  confirmLabel,
  trigger,
  now,
  onConfirm,
}: {
  title: string;
  description?: string;
  confirmLabel: string;
  trigger: ReactNode;
  now: Date;
  onConfirm: (atISO: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(() => todayKey(now));

  const confirm = () => {
    onConfirm(atForDateKey(key, now));
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setKey(todayKey(now));
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DateChoice value={key} onChange={setKey} now={now} />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">キャンセル</Button>
          </DialogClose>
          <Button onClick={confirm}>{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
