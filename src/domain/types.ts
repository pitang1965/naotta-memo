// なおったメモ ドメインモデル(ADR 0001 / 0003)
//
// - 症状(Issue): 再発しうる継続スレッド。active と resolved を何度でも行き来する。
// - チェックイン(Checkin): 症状のタイムライン上の「時刻つき1エントリ」。1日に何件でも置ける。
//   状態(6値)とメモを持つ。start/resolved/relapse も worse/same/better も同じ流れの中のイベント。
// - エピソード(Episode): 1回の「発症→治癒」の山。保存せず、エントリ列から導出する(episodes.ts)。
// - デイリームード(DailyMood): 症状に紐づかない、その日の総合的な体調。1日1件。

/** 強さの前回比(日々のボタン) */
export type MagnitudeStatus = "worse" | "same" | "better";
/** ライフサイクルの節目 */
export type LifecycleStatus = "start" | "resolved" | "relapse";
/**
 * 強さの判断を伴わない中立のメモ(例「病院に行った」)。状態ではなく"記録したいこと"の受け皿。
 * active/resolved は変えず、現在のエピソードに属する。→ ADR 0006
 */
export type NoteStatus = "memo";
export type Status = MagnitudeStatus | LifecycleStatus | NoteStatus;

export const MAGNITUDE_STATUSES: readonly MagnitudeStatus[] = [
  "worse",
  "same",
  "better",
];
export const LIFECYCLE_STATUSES: readonly LifecycleStatus[] = [
  "start",
  "resolved",
  "relapse",
];

export function isLifecycle(s: Status): s is LifecycleStatus {
  return s === "start" || s === "resolved" || s === "relapse";
}
export function isMagnitude(s: Status): s is MagnitudeStatus {
  return s === "worse" || s === "same" || s === "better";
}

/** 気圧(取得・保存のみ Phase 1。分析は Phase 2) */
export interface PressureSample {
  /** 実測気圧(hPa) */
  hpa: number;
  /** 直近24時間の気圧変化(API系列から算出。取れれば) */
  trend24h?: number | null;
}

/** 症状のタイムライン上の、時刻つき1エントリ */
export interface Checkin {
  id: string;
  /** 記録した瞬間(ISO タイムスタンプ)。「その日」はこの時刻のローカル日付で判定する */
  at: string;
  status: Status;
  /** どの状態にも付けられる自由記述(空可) */
  note: string;
  /** ライブ記録時のみ付く。過去日の手入力・訂正では付かない */
  pressure?: PressureSample | null;
}

/** 再発しうる継続スレッド。原初の発症日や治癒日は checkins から導出する */
export interface Issue {
  id: string;
  /** 自由入力の症状名(例「頭痛」「右ひざの痛み」) */
  name: string;
  /** 時刻つきエントリの流れ(順不同で保持してよい。導出時にソートする) */
  checkins: Checkin[];
}

export type Mood = "great" | "ok" | "meh" | "bad";

/** その日の総合的な体調。1日1件 */
export interface DailyMood {
  /** ローカル YYYY-MM-DD */
  date: string;
  mood: Mood;
}

export interface Settings {
  /** 「◯歳から」の表現に使う任意設定。ローカル YYYY-MM-DD(端末内のみ保存) */
  birthDate?: string;
}

export const APP_DATA_VERSION = 1;

/** 端末内に単一JSONとして永続化する全体データ */
export interface AppData {
  version: number;
  issues: Issue[];
  daily: DailyMood[];
  settings: Settings;
}
