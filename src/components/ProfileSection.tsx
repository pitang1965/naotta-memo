import { useState } from "react";
import { todayKey } from "@/domain/time";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ProfileSection({
  birthDate,
  onSave,
}: {
  birthDate: string | undefined;
  onSave: (date: string | undefined) => void;
}) {
  const today = todayKey(new Date());
  const [value, setValue] = useState(birthDate ?? "");
  const [done, setDone] = useState(false);

  const save = () => {
    const t = value.trim();
    onSave(t === "" ? undefined : t);
    setDone(true);
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div>
          <h2 className="font-serif text-base font-semibold">生年月日(任意)</h2>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            入れておくと、通院用のまとめで「◯歳(発症日)から」と、発症時点の年齢を添えられます。端末の中だけに保存されます。空にすると日付だけで表示します。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={value}
            max={today}
            onChange={(e) => {
              setValue(e.target.value);
              setDone(false);
            }}
            className="border-border bg-background text-foreground h-9 rounded-md border px-3 text-sm"
          />
          <Button variant="outline" className="ml-auto" onClick={save}>
            保存
          </Button>
        </div>
        {done && <p className="text-primary text-sm">保存しました。</p>}
      </CardContent>
    </Card>
  );
}
