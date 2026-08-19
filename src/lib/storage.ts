// ストレージ抽象層(ADR 0005 / 0003)。
// - データは端末内 localStorage のみ。単一キーに AppData 全体をJSONで保存する。
// - クライアント専用。SSR/prerender 中(window 不在)は触らない。
// - 破損データは黙って空で上書きしない。呼び出し側が警告できるよう例外を投げる。
//
// 実体を1箇所に閉じ込め、将来 IndexedDB へ差し替えても影響を局所化する。

import { APP_DATA_VERSION, type AppData } from "@/domain/types";
import { emptyAppData } from "@/domain/operations";

export const STORAGE_KEY = "naotta-memo-data";

export function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

/** 保存データが JSON として壊れていて読めない場合に投げる。空で上書きしないための合図 */
export class StorageCorruptError extends Error {
  readonly raw: string;
  constructor(message: string, raw: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "StorageCorruptError";
    this.raw = raw;
  }
}

/** スキーマのバージョン移行(現状 v1 のみ。将来ここで積み上げる) */
function migrate(data: AppData): AppData {
  // version が無い/古い場合の移行はここに追加していく。
  return { ...emptyAppData(), ...data, version: APP_DATA_VERSION };
}

/**
 * 端末から AppData を読む。
 * - 未保存(初回)なら null。
 * - JSON が壊れていれば StorageCorruptError を投げる(空で上書きさせない)。
 * - SSR 中は null。
 */
export function loadAppData(): AppData | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null || raw === "") return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new StorageCorruptError(
      "保存データを読み込めませんでした(JSONが壊れています)。",
      raw,
      { cause: e },
    );
  }
  if (typeof parsed !== "object" || parsed === null) {
    throw new StorageCorruptError("保存データの形式が不正です。", raw);
  }
  return migrate(parsed as AppData);
}

/** AppData を端末に保存する。SSR 中は何もしない */
export function saveAppData(data: AppData): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** 保存データが存在するか(破損していても true) */
export function hasStoredData(): boolean {
  if (!isBrowser()) return false;
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw !== null && raw !== "";
}

/**
 * ブラウザによる自動削除の可能性を下げる(永続化ストレージを要求)。
 * 対応していなければ false を返すだけで、失敗しても本体には影響しない。
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (!isBrowser() || !navigator.storage?.persist) return false;
  try {
    if (await navigator.storage.persisted?.()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
