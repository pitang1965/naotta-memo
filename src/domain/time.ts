// 日付・日数の計算。すべて「端末ローカルの日付境界」で扱う。
// 「その日」はエントリのタイムスタンプ(at)のローカル日付で判定する。

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** ISO タイムスタンプ(または Date)を、ローカルの YYYY-MM-DD に落とす */
export function localDateKey(at: string | Date): string {
  const d = at instanceof Date ? at : new Date(at);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** 今日のローカル日付キー */
export function todayKey(now: Date = new Date()): string {
  return localDateKey(now);
}

/** ISO タイムスタンプをローカルの HH:MM に */
export function localTime(at: string | Date): string {
  const d = at instanceof Date ? at : new Date(at);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/**
 * 2つの日付キー間の日数差(bKey - aKey)。DST の影響を避けるため UTC 正午基準で計算する。
 * 例: daysBetween("2026-08-14","2026-08-17") === 3
 */
export function daysBetween(aKey: string, bKey: string): number {
  const [ay, am, ad] = aKey.split("-").map(Number);
  const [by, bm, bd] = bKey.split("-").map(Number);
  const a = Date.UTC(ay, am - 1, ad);
  const b = Date.UTC(by, bm - 1, bd);
  return Math.round((b - a) / 86_400_000);
}

/**
 * 「◯日目」= 開始日から今日までの通日(両端含む)。
 * 例: 開始 8/14、今日 8/17 → 4(日目)
 */
export function inclusiveDayCount(fromKey: string, toKey: string): number {
  return daysBetween(fromKey, toKey) + 1;
}

/** 日付キーに日数を足す(UTC正午基準・DST安全) */
export function addDays(key: string, delta: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d) + delta * 86_400_000);
  return `${t.getUTCFullYear()}-${pad2(t.getUTCMonth() + 1)}-${pad2(t.getUTCDate())}`;
}

/** 今日を末尾に、直近 n 日分の日付キーを古い順で返す */
export function recentDayKeys(n: number, now: Date = new Date()): string[] {
  const today = todayKey(now);
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) keys.push(addDays(today, -i));
  return keys;
}
