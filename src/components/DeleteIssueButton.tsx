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

export function DeleteIssueButton({
  name,
  onDelete,
  className,
  label,
}: {
  name: string;
  onDelete: () => void;
  className?: string;
  /** アイコンの横に出す文言(省略時はアイコンのみ) */
  label?: string;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        aria-label={`「${name}」を削除`}
        className={cn(
          "text-muted-foreground hover:text-destructive inline-flex shrink-0 items-center gap-1 transition-colors",
          label && "text-xs",
          className,
        )}
      >
        <Trash2 className={label ? "size-3.5" : "size-4"} />
        {label}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-serif">
            「{name}」を削除しますか?
          </AlertDialogTitle>
          <AlertDialogDescription>
            この症状のすべての記録(経過・治癒・再発)が消え、元に戻せません。
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
