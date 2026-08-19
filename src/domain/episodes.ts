// エピソード導出(ADR 0001)。
// 症状(Issue)は保存された start/resolved/relapse/worse/same/better の
// 「時刻つきエントリの流れ」だけを持つ。エピソード(1回の発症〜治癒の山)や
// 現在の状態(active/resolved)は、ここで流れから導出する。保存はしない。

import type { Checkin, Issue } from "./types";
import { isLifecycle } from "./types";
import { daysBetween, inclusiveDayCount, localDateKey, todayKey } from "./time";

/** 1回の「発症(または再発)→治癒」の山。エントリ列から導出したビュー */
export interface Episode {
  /** 0始まりの通し番号 */
  index: number;
  /** initial=発症で始まる山 / relapse=再発で始まる山 */
  kind: "initial" | "relapse";
  /** 山の始まり(start または relapse エントリ)の時刻 */
  startAt: string;
  /** 山の終わり(resolved エントリ)の時刻。継続中なら null */
  endAt: string | null;
  /** 治癒して閉じているか */
  closed: boolean;
  /** この山に属するエントリ(時刻順) */
  checkins: Checkin[];
  /** 閉じた山の期間(発症〜治癒の通日、両端含む)。継続中は null */
  durationDays: number | null;
}

function byAtAsc(a: Checkin, b: Checkin): number {
  if (a.at < b.at) return -1;
  if (a.at > b.at) return 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** checkins を時刻昇順で複製して返す(元配列は変更しない) */
export function sortedCheckins(issue: Issue): Checkin[] {
  return [...issue.checkins].sort(byAtAsc);
}

/**
 * エントリの流れをエピソードの列に畳む。
 * - start / relapse が山を開く(最初の1つは initial、以降は relapse 扱い)
 * - resolved が今の山を閉じる
 * - worse / same / better は現在開いている山に属する
 * データが多少壊れていても落とさないよう、孤立した経過・治癒も拾う。
 */
export function deriveEpisodes(issue: Issue): Episode[] {
  const episodes: Episode[] = [];
  let current: Episode | null = null;
  let opened = 0;

  const openEpisode = (at: string): Episode => ({
    index: episodes.length,
    kind: opened === 0 ? "initial" : "relapse",
    startAt: at,
    endAt: null,
    closed: false,
    checkins: [],
    durationDays: null,
  });

  const closeAndPush = (ep: Episode, endAt: string | null) => {
    if (endAt) {
      ep.endAt = endAt;
      ep.closed = true;
      ep.durationDays = inclusiveDayCount(
        localDateKey(ep.startAt),
        localDateKey(endAt),
      );
    }
    episodes.push(ep);
  };

  for (const c of sortedCheckins(issue)) {
    if (c.status === "start" || c.status === "relapse") {
      // 既に開いている山があれば、閉じずにそのまま確定してから新しい山を開く。
      if (current) episodes.push(current);
      current = openEpisode(c.at);
      opened += 1;
      current.checkins.push(c);
    } else if (c.status === "resolved") {
      if (!current) {
        // 開いていないのに治癒 → その時刻だけの山として拾う(データ保全)。
        current = openEpisode(c.at);
        opened += 1;
      }
      current.checkins.push(c);
      closeAndPush(current, c.at);
      current = null;
    } else {
      // 経過(worse/same/better)。開いていなければ暗黙の山を開く。
      if (!current) {
        current = openEpisode(c.at);
        opened += 1;
      }
      current.checkins.push(c);
    }
  }
  if (current) episodes.push(current);

  return episodes.map((ep, i) => ({ ...ep, index: i }));
}

/** 最後に記録されたエントリの時刻(症状の並べ替え用)。無ければ空文字 */
export function latestCheckinAt(issue: Issue): string {
  const s = sortedCheckins(issue);
  return s.length ? s[s.length - 1].at : "";
}

/** 現在の状態: 最新のライフサイクル・イベントで決まる(resolved なら resolved、他は active) */
export function deriveStatus(issue: Issue): "active" | "resolved" {
  const sorted = sortedCheckins(issue);
  for (let i = sorted.length - 1; i >= 0; i--) {
    const s = sorted[i].status;
    if (!isLifecycle(s)) continue;
    return s === "resolved" ? "resolved" : "active";
  }
  return "active";
}

/** 現在開いている(継続中の)エピソード。治癒済みなら null */
export function currentEpisode(issue: Issue): Episode | null {
  const eps = deriveEpisodes(issue);
  const last = eps[eps.length - 1];
  return last && !last.closed ? last : null;
}

/**
 * 現在エピソードの経過日数(「このぶり返し◯日目」)。直近の start/relapse から今日までの通日。
 * 治癒中(継続中の山がない)なら null。
 */
export function currentEpisodeDays(
  issue: Issue,
  now: Date = new Date(),
): number | null {
  const ep = currentEpisode(issue);
  if (!ep) return null;
  return inclusiveDayCount(localDateKey(ep.startAt), todayKey(now));
}

/** 原初の発症日(最初の山の始まり)。エントリが無ければ null */
export function firstOnsetKey(issue: Issue): string | null {
  const eps = deriveEpisodes(issue);
  return eps.length ? localDateKey(eps[0].startAt) : null;
}

/** 罹病スパン(慢性・体質性の表現に使う) */
export interface DiseaseSpan {
  /** 最初の発症日(ローカル YYYY-MM-DD) */
  fromKey: string;
  /** 通算期間の通日(両端含む) */
  days: number;
  /** 治って再発を繰り返したか(エピソードが複数)。true なら「断続的」 */
  intermittent: boolean;
  /** これまでのエピソード数 */
  episodeCount: number;
}

export function diseaseSpan(
  issue: Issue,
  now: Date = new Date(),
): DiseaseSpan | null {
  const eps = deriveEpisodes(issue);
  if (eps.length === 0) return null;
  const fromKey = localDateKey(eps[0].startAt);
  const last = eps[eps.length - 1];
  const toKey = last.closed
    ? localDateKey(last.endAt ?? last.startAt)
    : todayKey(now);
  return {
    fromKey,
    days: daysBetween(fromKey, toKey) + 1,
    intermittent: eps.length > 1,
    episodeCount: eps.length,
  };
}
