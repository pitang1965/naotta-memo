// CSV取り込み(§6.5 / ADR 0004)。
// 1行=1つの時刻つきエントリ。同じ症状名の行は1スレッドに束ね、新しい Issue として追加する。
// ここは検証・整形の純ロジック。UI(プレビュー・確定)は別。

import type { Checkin, Issue, Status } from "@/domain/types";

/** 見本CSV(ダウンロード用)。Excel 対応のため BOM を付ける */
export const TEMPLATE_CSV =
  "﻿" +
  [
    "症状名,日付,時刻,状態,メモ",
    "頭痛,2026-06-03,,発症,ズキズキ 右後頭部が痛い",
    "頭痛,2026-06-04,,悪化,",
    "頭痛,2026-06-06,,治った,",
    "蕁麻疹,2026-05-01,15:00,メモ,病院に行った",
  ].join("\r\n") +
  "\r\n";

const STATUS_MAP: Record<string, Status> = {
  発症: "start",
  start: "start",
  悪化: "worse",
  worse: "worse",
  変わらず: "same",
  same: "same",
  改善: "better",
  better: "better",
  治った: "resolved",
  治癒: "resolved",
  resolved: "resolved",
  再発: "relapse",
  relapse: "relapse",
  メモ: "memo",
  その他: "memo",
  memo: "memo",
};

const COLUMN_ALIASES = {
  name: ["症状名", "name"],
  date: ["日付", "date"],
  time: ["時刻", "time"],
  status: ["状態", "status"],
  note: ["メモ", "note"],
};

export interface CsvParsedRow {
  line: number; // データ行の番号(1始まり)
  name: string;
  dateKey: string;
  time: string; // "" なら時刻なし
  status: Status;
  note: string;
  at: string; // ISO
  valid: boolean;
  include: boolean;
  error?: string;
}

export interface CsvParseResult {
  headerError?: string;
  rows: CsvParsedRow[];
}

/** RFC4180 のクオートを解釈して、レコード(行)×フィールド(列)に分解する */
function parseRecords(input: string): string[][] {
  let text = input;
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // BOM 除去
  const records: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  let i = 0;
  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    records.push(row);
    row = [];
  };
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += c;
        i++;
      }
    } else if (c === '"') {
      inQuotes = true;
      i++;
    } else if (c === ",") {
      endField();
      i++;
    } else if (c === "\r") {
      i++;
    } else if (c === "\n") {
      endRow();
      i++;
    } else {
      field += c;
      i++;
    }
  }
  if (field !== "" || row.length > 0) endRow();
  return records;
}

function findColumn(header: string[], aliases: string[]): number {
  const norm = header.map((h) => h.trim().toLowerCase());
  for (const a of aliases) {
    const idx = norm.indexOf(a.toLowerCase());
    if (idx !== -1) return idx;
  }
  return -1;
}

function parseDateKey(s: string): string | null {
  const m = s.trim().match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (!m) return null;
  const y = +m[1];
  const mo = +m[2];
  const d = +m[3];
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) {
    return null;
  }
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function parseTimeStr(s: string): string | null {
  const m = s.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = +m[1];
  const mi = +m[2];
  if (h > 23 || mi > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`;
}

/** 日付キー(＋任意の時刻)を ISO に。時刻なしはその日の正午 */
function toISO(dateKey: string, time: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const [hh, mi] = time ? time.split(":").map(Number) : [12, 0];
  return new Date(y, m - 1, d, hh, mi, 0).toISOString();
}

const isEmptyRecord = (rec: string[]) => rec.every((c) => c.trim() === "");

export function parseCsv(text: string): CsvParseResult {
  const records = parseRecords(text);
  if (records.length === 0) return { headerError: "内容が空です。", rows: [] };

  const header = records[0];
  const col = {
    name: findColumn(header, COLUMN_ALIASES.name),
    date: findColumn(header, COLUMN_ALIASES.date),
    time: findColumn(header, COLUMN_ALIASES.time),
    status: findColumn(header, COLUMN_ALIASES.status),
    note: findColumn(header, COLUMN_ALIASES.note),
  };
  const missing: string[] = [];
  if (col.name === -1) missing.push("症状名");
  if (col.date === -1) missing.push("日付");
  if (col.status === -1) missing.push("状態");
  if (missing.length) {
    return {
      headerError: `1行目のヘッダーに ${missing.join("・")} の列が見つかりません(必要な列: 症状名, 日付, 状態)。`,
      rows: [],
    };
  }

  const cell = (rec: string[], idx: number) =>
    idx === -1 ? "" : (rec[idx] ?? "").trim();

  const rows: CsvParsedRow[] = [];
  let line = 0;
  for (let r = 1; r < records.length; r++) {
    const rec = records[r];
    if (isEmptyRecord(rec)) continue;
    line++;

    const name = cell(rec, col.name);
    const dateRaw = cell(rec, col.date);
    const timeRaw = cell(rec, col.time);
    const statusRaw = cell(rec, col.status);
    const note = col.note === -1 ? "" : (rec[col.note] ?? "");

    let error: string | undefined;
    const dateKey = parseDateKey(dateRaw);
    let time = "";
    if (timeRaw !== "") {
      const t = parseTimeStr(timeRaw);
      if (t === null) error = `時刻「${timeRaw}」が不正です(HH:MM)。`;
      else time = t;
    }
    let status: Status = "memo";
    if (statusRaw !== "") {
      const mapped =
        STATUS_MAP[statusRaw] ?? STATUS_MAP[statusRaw.toLowerCase()];
      if (!mapped) error = `状態「${statusRaw}」は不明です。`;
      else status = mapped;
    }
    if (!name) error = "症状名がありません。";
    if (!dateKey) error = `日付「${dateRaw}」が不正です(YYYY-MM-DD)。`;

    const valid = !error;
    rows.push({
      line,
      name,
      dateKey: dateKey ?? dateRaw,
      time,
      status,
      note,
      at: dateKey ? toISO(dateKey, time) : "",
      valid,
      include: valid,
      error,
    });
  }

  return { rows };
}

/** 取り込む行(valid かつ include)を、症状名ごとの新しい Issue に束ねる */
export function rowsToIssues(rows: CsvParsedRow[]): Issue[] {
  const byName = new Map<string, Checkin[]>();
  const order: string[] = [];
  for (const r of rows) {
    if (!r.valid || !r.include) continue;
    if (!byName.has(r.name)) {
      byName.set(r.name, []);
      order.push(r.name);
    }
    byName.get(r.name)!.push({
      id: crypto.randomUUID(),
      at: r.at,
      status: r.status,
      note: r.note,
    });
  }
  return order.map((name) => ({
    id: crypto.randomUUID(),
    name,
    checkins: byName.get(name)!,
  }));
}
