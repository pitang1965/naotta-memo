import { useRef, useState, type ChangeEvent } from "react";
import { Check, Download, FileUp, Pencil, Upload, X } from "lucide-react";
import type { Issue, Status } from "@/domain/types";
import {
  parseCsv,
  revalidateRow,
  rowsToIssues,
  TEMPLATE_CSV,
  type CsvParsedRow,
} from "@/lib/csvImport";
import { downloadText } from "@/lib/backup";
import { STATUS_LABEL, jpDate } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const STATUS_CHOICES: Status[] = [
  "start",
  "worse",
  "same",
  "better",
  "resolved",
  "relapse",
  "memo",
];

interface Draft {
  name: string;
  dateKey: string;
  time: string;
  status: Status;
  note: string;
}

export function CsvImport({ onImport }: { onImport: (issues: Issue[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [rows, setRows] = useState<CsvParsedRow[]>([]);
  const [headerError, setHeaderError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);

  const analyze = (src: string) => {
    const res = parseCsv(src);
    setHeaderError(res.headerError ?? null);
    setRows(res.rows);
    setDone(null);
    setEditing(null);
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const content = await file.text();
    setText(content);
    analyze(content);
  };

  const toggle = (line: number) =>
    setRows((rs) =>
      rs.map((r) => (r.line === line ? { ...r, include: !r.include } : r)),
    );

  const startEdit = (r: CsvParsedRow) => {
    setDraft({
      name: r.name,
      dateKey: r.valid ? r.dateKey : "",
      time: r.time,
      status: r.status,
      note: r.note,
    });
    setEditing(r.line);
  };

  const applyEdit = () => {
    if (draft === null || editing === null) return;
    setRows((rs) =>
      rs.map((r) =>
        r.line === editing ? revalidateRow({ ...r, ...draft }) : r,
      ),
    );
    setEditing(null);
    setDraft(null);
  };

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
          <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
            <span className="text-foreground font-medium">状態に使える値</span>:
            {STATUS_CHOICES.map((s) => STATUS_LABEL[s]).join(" / ")}
            (空欄は「メモ」。英語コード start/worse/same/better/resolved/relapse/memo も可)
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
          <Button
            variant="outline"
            onClick={() => analyze(text)}
            disabled={!text.trim()}
          >
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
            <ul className="border-border divide-border max-h-72 divide-y overflow-auto rounded-md border">
              {rows.map((r) =>
                editing === r.line && draft ? (
                  <li key={r.line} className="flex flex-col gap-2 px-3 py-2">
                    <Input
                      value={draft.name}
                      onChange={(e) =>
                        setDraft({ ...draft, name: e.target.value })
                      }
                      placeholder="症状名"
                      className="h-8"
                    />
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="date"
                        value={draft.dateKey}
                        max={new Date().toISOString().slice(0, 10)}
                        onChange={(e) =>
                          setDraft({ ...draft, dateKey: e.target.value })
                        }
                        className="border-border bg-background h-8 rounded-md border px-2 text-sm"
                      />
                      <input
                        type="time"
                        value={draft.time}
                        onChange={(e) =>
                          setDraft({ ...draft, time: e.target.value })
                        }
                        className="border-border bg-background h-8 rounded-md border px-2 text-sm"
                      />
                      <select
                        value={draft.status}
                        onChange={(e) =>
                          setDraft({ ...draft, status: e.target.value as Status })
                        }
                        className="border-border bg-background h-8 rounded-md border px-2 text-sm"
                      >
                        {STATUS_CHOICES.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Input
                      value={draft.note}
                      onChange={(e) =>
                        setDraft({ ...draft, note: e.target.value })
                      }
                      placeholder="メモ"
                      className="h-8"
                    />
                    <div className="flex justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditing(null);
                          setDraft(null);
                        }}
                      >
                        <X />
                        取消
                      </Button>
                      <Button size="sm" onClick={applyEdit}>
                        <Check />
                        適用
                      </Button>
                    </div>
                  </li>
                ) : (
                  <li
                    key={r.line}
                    className="flex items-start gap-2 px-3 py-2 text-sm"
                  >
                    {r.valid ? (
                      <input
                        type="checkbox"
                        checked={r.include}
                        onChange={() => toggle(r.line)}
                        className="mt-1 shrink-0"
                      />
                    ) : (
                      <span className="mt-0.5 shrink-0 text-xs">⚠️</span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={cn(!r.valid && "text-muted-foreground")}>
                        <span className="font-serif font-semibold">
                          {r.name || "(名前なし)"}
                        </span>{" "}
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
                    <button
                      onClick={() => startEdit(r)}
                      aria-label="この行を編集"
                      className="text-muted-foreground hover:text-foreground mt-0.5 shrink-0"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                  </li>
                ),
              )}
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
