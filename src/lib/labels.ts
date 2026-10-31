import type { Mood, Status } from "@/domain/types";

export const STATUS_LABEL: Record<Status, string> = {
  start: "発症",
  worse: "悪化",
  same: "変わらず",
  better: "改善",
  resolved: "治った",
  relapse: "再発",
  memo: "メモ",
};

// Record<Mood, …> にしておくと、気分の書き忘れがコンパイルエラーになる。並び順は書いた順
export const MOOD_DISPLAY: Record<Mood, { symbol: string; text: string }> = {
  great: { symbol: "◎", text: "絶好調" },
  ok: { symbol: "○", text: "普通" },
  meh: { symbol: "△", text: "だるい" },
  bad: { symbol: "✕", text: "つらい" },
};

export const MOOD_OPTIONS = (Object.keys(MOOD_DISPLAY) as Mood[]).map((value) => ({
  value,
  ...MOOD_DISPLAY[value],
}));

/** ローカル日付キー(YYYY-MM-DD)を「M月D日」表記に */
export function jpDate(key: string): string {
  const [, m, d] = key.split("-");
  return `${Number(m)}月${Number(d)}日`;
}

/** ローカル日付キーを「YYYY年M月D日」表記に */
export function jpDateFull(key: string): string {
  const [y, m, d] = key.split("-");
  return `${y}年${Number(m)}月${Number(d)}日`;
}
