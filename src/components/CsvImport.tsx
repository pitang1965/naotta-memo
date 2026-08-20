import { useRef, useState, type ChangeEvent } from "react";
import { Download, FileUp, Upload } from "lucide-react";
import type { Issue } from "@/domain/types";
import {
  parseCsv,
  rowsToIssues,
  TEMPLATE_CSV,
  type CsvParsedRow,
} from "@/lib/csvImport";
import { downloadText } from "@/lib/backup";
import { STATUS_LABEL, jpDate } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export function CsvImport({ onImport }: { onImport: (issues: Issue[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [rows, setRows] = useState<CsvParsedRow[]>([]);
  const [headerError, setHeaderError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const analyze = (src: string) => {
    const res = parseCsv(src);
    setHeaderError(res.headerError ?? null);
    setRows(res.rows);
    setDone(null);
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const content = await file.text();
    setText(content);
    analyze(content);
  };

  const toggle = (i: number) =>
    setRows((rs) =>
      rs.map((r, idx) => (idx === i ? { ...r, include: !r.include } : r)),
    );

  const includable = rows.filter((r) => r.valid);
  const includedCount = includable.filter((r) => r.include).length;
  const invalidCount = rows.length - includable.length;

  const confirm = () => {
    const issues = rowsToIssues(rows);
    if (issues.length === 0) return;
    onImport(issues);
    const entries = issues.reduce((n, i) => n + i.checkins.length, 0);
    setDone(`${issues.length} 件の症状(${entries} 件の記録)を取り込みました。`);
    setRows([]);
    setText("");
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div>
          <h2 className="font-serif text-base font-semibold">
            メモを取り込む(CSV)
          </h2>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            表計算ソフトや、手元のAIで整えた CSV を貼り付けて取り込めます(列: 症状名, 日付, 時刻, 状態, メモ)。同じ症状名は1つにまとまり、新しい症状として追加されます。
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          onClick={() =>
            downloadText(
              TEMPLATE_CSV,
              "naotta-memo-template.csv",
              "text/csv;charset=utf-8",
            )
          }
        >
          <Download />
          見本CSVをダウンロード
        </Button>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"症状名,日付,時刻,状態,メモ\n頭痛,2026-06-03,,発症,ズキズキ"}
          rows={5}
          className="min-h-28 font-mono text-xs"
        />

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => analyze(text)} disabled={!text.trim()}>
            <FileUp />
            解析する
          </Button>
          <Button variant="ghost" onClick={() => inputRef.current?.click()}>
            <Upload />
            ファイルを選ぶ
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv,text/plain"
            onChange={onFile}
            className="hidden"
          />
        </div>

        {headerError && (
          <p className="text-destructive border-destructive/40 bg-destructive/5 rounded-md border px-3 py-2 text-sm">
            {headerError}
          </p>
        )}

        {rows.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-xs">
              {rows.length} 行中 {includedCount} 件を取り込み
              {invalidCount > 0 && `(取り込めない行 ${invalidCount} 件)`}
            </p>
            <ul className="border-border max-h-64 divide-y divide-border overflow-auto rounded-md border">
              {rows.map((r, i) => (
                <li
                  key={r.line}
                  className="flex items-start gap-2 px-3 py-2 text-sm"
                >
                  {r.valid ? (
                    <input
                      type="checkbox"
                      checked={r.include}
                      onChange={() => toggle(i)}
                      className="mt-1 shrink-0"
                    />
                  ) : (
                    <span className="mt-0.5 shrink-0 text-xs">⚠️</span>
                  )}
                  <div className="min-w-0">
                    <p className={cn(!r.valid && "text-muted-foreground")}>
                      <span className="font-serif font-semibold">{r.name || "(名前なし)"}</span>{" "}
                      <span className="text-muted-foreground text-xs tabular-nums">
                        {r.valid ? jpDate(r.dateKey) : r.dateKey}
                        {r.time && ` ${r.time}`}
                      </span>{" "}
                      <span className="font-medium">
                        {STATUS_LABEL[r.status]}
                      </span>
                      {r.note && (
                        <span className="text-muted-foreground"> ・{r.note}</span>
                      )}
                    </p>
                    {r.error && (
                      <p className="text-destructive text-xs">{r.error}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <Button
              onClick={confirm}
              disabled={includedCount === 0}
              className="self-end"
            >
              取り込む({includedCount} 件)
            </Button>
          </div>
        )}

        {done && <p className="text-primary text-sm">{done}</p>}
      </CardContent>
    </Card>
  );
}
