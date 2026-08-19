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

export const MOOD_OPTIONS: { value: Mood; symbol: string; text: string }[] = [
  { value: "great", symbol: "◎", text: "絶好調" },
  { value: "ok", symbol: "○", text: "普通" },
  { value: "meh", symbol: "△", text: "だるい" },
  { value: "bad", symbol: "✕", text: "つらい" },
];

export const MOOD_LABEL: Record<Mood, string> = {
  great: "絶好調",
  ok: "普通",
  meh: "だるい",
  bad: "つらい",
};

export const MOOD_SYMBOL: Record<Mood, string> = {
  great: "◎",
  ok: "○",
  meh: "△",
  bad: "✕",
};

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
