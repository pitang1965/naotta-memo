import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DeleteDayButton({
  dateLabel,
  count,
  onDelete,
}: {
  dateLabel: string;
  count: number;
  onDelete: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        aria-label={`${dateLabel}の記録をまとめて削除`}
        className="text-muted-foreground hover:text-destructive inline-flex items-center gap-1 text-xs transition-colors"
      >
        <Trash2 className="size-3.5" />
        この日を削除
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-serif">
            {dateLabel} の記録を削除しますか?
          </AlertDialogTitle>
          <AlertDialogDescription>
            この日の記録{count} 件をまとめて削除します。元に戻せません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            className={cn(buttonVariants({ variant: "destructive" }))}
          >
            削除する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
