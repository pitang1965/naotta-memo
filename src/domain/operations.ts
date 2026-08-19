// ドメイン操作。すべて不変(新しいオブジェクトを返す)。UI からはこれを通して状態を変える。
// 記録は上書きせず「足す」。訂正はどのエントリも編集・削除できる(ADR 0003)。

import {
  APP_DATA_VERSION,
  type AppData,
  type Checkin,
  type Issue,
  type Mood,
  type Status,
} from "./types";

function newId(): string {
  // ブラウザ・Node22 双方で利用可能。
  return crypto.randomUUID();
}

function nowIso(): string {
  return new Date().toISOString();
}

// ── Issue / Checkin ───────────────────────────────────────────────

export function emptyAppData(): AppData {
  return { version: APP_DATA_VERSION, issues: [], daily: [], settings: {} };
}

/** 新規登録: 名前を付けて新しい症状スレッドを起こす(初回の start エントリを持つ) */
export function createIssue(
  name: string,
  at: string = nowIso(),
  note = "",
): Issue {
  return {
    id: newId(),
    name: name.trim(),
    checkins: [{ id: newId(), at, status: "start", note }],
  };
}

/** 任意の状態のエントリを1件足す(worse/same/better/resolved/relapse/start) */
export function addCheckin(
  issue: Issue,
  status: Status,
  opts: { at?: string; note?: string; pressure?: Checkin["pressure"] } = {},
): Issue {
  const entry: Checkin = {
    id: newId(),
    at: opts.at ?? nowIso(),
    status,
    note: opts.note ?? "",
    ...(opts.pressure !== undefined ? { pressure: opts.pressure } : {}),
  };
  return { ...issue, checkins: [...issue.checkins, entry] };
}

/** 治癒を確定する。治った日(at)は既定=今、過去日も指定可 */
export function resolveIssue(issue: Issue, at: string = nowIso()): Issue {
  return addCheckin(issue, "resolved", { at });
}

/** 再発を記録する。ぶり返した日(at)は既定=今、過去日も指定可。新しいエピソードが始まる */
export function relapseIssue(issue: Issue, at: string = nowIso()): Issue {
  return addCheckin(issue, "relapse", { at });
}

/** エントリを編集(状態・メモ・日時など)。「治癒の取り消し」はこの汎用訂正で治癒エントリを削除して行う */
export function editCheckin(
  issue: Issue,
  checkinId: string,
  patch: Partial<Omit<Checkin, "id">>,
): Issue {
  return {
    ...issue,
    checkins: issue.checkins.map((c) =>
      c.id === checkinId ? { ...c, ...patch } : c,
    ),
  };
}

/** エントリを削除 */
export function deleteCheckin(issue: Issue, checkinId: string): Issue {
  return {
    ...issue,
    checkins: issue.checkins.filter((c) => c.id !== checkinId),
  };
}

/** 症状の改名(表記の直し) */
export function renameIssue(issue: Issue, name: string): Issue {
  return { ...issue, name: name.trim() };
}

// ── AppData 全体 ─────────────────────────────────────────────────

export function addIssue(data: AppData, issue: Issue): AppData {
  return { ...data, issues: [...data.issues, issue] };
}

export function replaceIssue(data: AppData, issue: Issue): AppData {
  return {
    ...data,
    issues: data.issues.map((i) => (i.id === issue.id ? issue : i)),
  };
}

export function removeIssue(data: AppData, issueId: string): AppData {
  return { ...data, issues: data.issues.filter((i) => i.id !== issueId) };
}

/** その日のデイリームードを記録/更新(1日1件・上書き) */
export function upsertMood(data: AppData, date: string, mood: Mood): AppData {
  const exists = data.daily.some((d) => d.date === date);
  const daily = exists
    ? data.daily.map((d) => (d.date === date ? { ...d, mood } : d))
    : [...data.daily, { date, mood }];
  return { ...data, daily };
}

/** その日のデイリームードを取り消す */
export function clearMood(data: AppData, date: string): AppData {
  return { ...data, daily: data.daily.filter((d) => d.date !== date) };
}

/** 任意設定(生年など)を更新 */
export function updateSettings(
  data: AppData,
  patch: Partial<AppData["settings"]>,
): AppData {
  return { ...data, settings: { ...data.settings, ...patch } };
}
