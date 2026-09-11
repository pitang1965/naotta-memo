import { useState } from "react";
import { Check, Pencil } from "lucide-react";
import type { Mood } from "@/domain/types";
import { MOOD_OPTIONS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * 今日の調子。タップした瞬間に保存する(1タップで記録できる軽さを守る)。
 *
 * そのぶん、押したあとに選択肢を並べたままにしない。症状カードの状態ボタンは
 * 「選ぶ → 保存」の二段構えで、選択中の見た目は"まだ未保存"を意味する。同じ
 * 見た目をここで即時保存に使うと「決定していない」と読まれてしまうので、
 * 保存後は選択肢を畳んで記録済みの一行に差し替える。選択肢が消えること自体が
 * 決着の合図になる(調子の推移の編集パネルが閉じるのと同じ理屈)。
 */
export function MoodPicker({
  current,
  onPick,
  onClear,
}: {
  current: Mood | undefined;
  onPick: (mood: Mood) => void;
  onClear: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const picked = MOOD_OPTIONS.find((o) => o.value === current);
  const choosing = !picked || editing;

  return (
    <Card className="gap-3 py-4">
      <CardContent className="px-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-serif text-base font-semibold tracking-wide">
            今日の調子
          </h2>
          {picked &&
            (editing ? (
              <button
                className="text-muted-foreground hover:text-foreground text-xs underline-offset-2 hover:underline"
                onClick={() => setEditing(false)}
              >
                やめる
              </button>
            ) : (
              <button
                className="text-muted-foreground hover:text-foreground text-xs underline-offset-2 hover:underline"
                onClick={() => {
                  onClear();
                  setEditing(false);
                  setMessage("今日の調子の記録を削除しました");
                }}
              >
                記録を削除
              </button>
            ))}
        </div>

        {choosing ? (
          <div
            role="radiogroup"
            aria-label="今日の調子"
            className="grid grid-cols-4 gap-2"
          >
            {MOOD_OPTIONS.map((o) => {
              const active = current === o.value;
              return (
                <button
                  key={o.value}
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    onPick(o.value);
                    setEditing(false);
                    setMessage(`${o.symbol} ${o.text} として記録しました`);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border py-2.5 transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background hover:bg-accent text-foreground",
                  )}
                >
                  <span className="text-lg leading-none">{o.symbol}</span>
                  <span className="text-xs">{o.text}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="border-primary/30 bg-primary/5 flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5">
            <p className="text-sm">
              <Check
                aria-hidden
                className="text-primary mr-1.5 inline size-4 align-[-3px]"
              />
              <span className="font-medium">
                {picked.symbol} {picked.text}
              </span>
              <span className="text-muted-foreground"> として記録しました</span>
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
            >
              <Pencil />
              変更
            </Button>
          </div>
        )}

        {/* 選択肢が結果表示に差し替わることは目には見えるが、読み上げには乗らない */}
        <p aria-live="polite" className="sr-only">
          {message}
        </p>
      </CardContent>
    </Card>
  );
}
