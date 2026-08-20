// JSONバックアップ(§6.1 / Q12)。
// - エクスポート: AppData 全体を JSON ファイルとしてダウンロード。
// - インポート: JSON を読み、構造を検証して AppData を得る(上書きは呼び出し側)。
//   不正な JSON/構造はここで例外になり、既存データには触れない。
// マージは Phase 2。ここでは検証と入出力だけを担う。

import { z } from "zod";
import { APP_DATA_VERSION, type AppData } from "@/domain/types";

const PressureSchema = z
  .object({
    hpa: z.number(),
    trend24h: z.number().nullable().optional(),
  })
  .nullable()
  .optional();

const CheckinSchema = z.object({
  id: z.string(),
  at: z.string(),
  status: z.enum([
    "worse",
    "same",
    "better",
    "start",
    "resolved",
    "relapse",
    "memo",
  ]),
  note: z.string(),
  pressure: PressureSchema,
});

const IssueSchema = z.object({
  id: z.string(),
  name: z.string(),
  checkins: z.array(CheckinSchema),
});

const DailyMoodSchema = z.object({
  date: z.string(),
  mood: z.enum(["great", "ok", "meh", "bad"]),
});

const SettingsSchema = z
  .object({ birthDate: z.string().optional() })
  .default({});

const AppDataSchema = z.object({
  version: z.number().default(APP_DATA_VERSION),
  issues: z.array(IssueSchema),
  daily: z.array(DailyMoodSchema),
  settings: SettingsSchema,
});

/** テキスト(ファイル内容)を検証して AppData にする。不正なら例外を投げる */
export function parseBackup(text: string): AppData {
  const raw = JSON.parse(text) as unknown; // 不正JSONは SyntaxError
  return AppDataSchema.parse(raw) as AppData; // 構造不正は ZodError
}

/** バックアップのファイル名(例: naotta-memo-backup-20260819.json) */
export function backupFilename(now: Date = new Date(), suffix = ""): string {
  const p = (n: number) => String(n).padStart(2, "0");
  const base = `naotta-memo-backup-${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}`;
  return suffix ? `${base}-${suffix}.json` : `${base}.json`;
}

/** テキストをファイルとしてダウンロードさせる(クライアント専用) */
export function downloadText(
  text: string,
  filename: string,
  type = "text/plain",
): void {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** JSON をファイルとしてダウンロードさせる(クライアント専用) */
export function downloadJson(data: unknown, filename: string): void {
  downloadText(JSON.stringify(data, null, 2), filename, "application/json");
}
