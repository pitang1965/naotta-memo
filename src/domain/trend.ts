// 推移(CONTEXT「推移」)の症状の帯。1日1マスで、その日に何があったかを導出する。
//
// - 下地: その日にエピソードが続いていたか(エントリが無い日も、山の途中なら続いている)
// - 経過: その日の最新の経過エントリ(worse/same/better)。memo は数えない
// - 節目: 発症・再発・治癒は、最新かどうかに関わらずその日の出来事として必ず拾う
// 強さは前回比なので、水準(折れ線や濃淡)としては描かない。

import type { Checkin, Issue, MagnitudeStatus } from "./types";
import { isMagnitude } from "./types";
import { deriveEpisodes, latestCheckinAt, sortedCheckins } from "./episodes";
import { localDateKey } from "./time";

export interface TrendDay {
  /** ローカル YYYY-MM-DD */
  date: string;
  /** その日にエピソードが続いていたか */
  ongoing: boolean;
  /** その日の最新の経過エントリ。無ければ null */
  magnitude: MagnitudeStatus | null;
  /** 経過エントリが2件以上あった(代表になれなかった記録がある) */
  multipleMagnitudes: boolean;
  /** その日に発症または再発した */
  onset: boolean;
  /** その日に治癒した。unknown は治った日不明の治癒(この日より後のどこかで治った) */
  resolved: "known" | "unknown" | null;
  /** その日の全エントリ(時刻順) */
  checkins: Checkin[];
}

export interface TrendRow {
  issue: Issue;
  days: TrendDay[];
}

/** エピソードが続いていた日の区間(両端含む)。to=null は今も続いている */
function ongoingSpans(issue: Issue): { from: string; to: string | null }[] {
  const eps = deriveEpisodes(issue);
  return eps.map((ep, i) => {
    const from = localDateKey(ep.startAt);
    if (ep.closed) {
      // 治った日不明でも、治癒エントリは最後の記録の直後に置かれるので、その日付で止まる。
      const resolved = ep.checkins.findLast((c) => c.status === "resolved");
      return { from, to: localDateKey(resolved?.at ?? ep.startAt) };
    }
    // 閉じないまま次の山が始まった(統合などで起きうる)なら、次の山が始まるまで続いていたとみなす。
    const next = eps[i + 1];
    return { from, to: next ? localDateKey(next.startAt) : null };
  });
}

/** 1つの症状を、指定した日付キー(古い順)ごとのマスに畳む */
export function trendDays(issue: Issue, dayKeys: string[]): TrendDay[] {
  const spans = ongoingSpans(issue);
  const byDay = new Map<string, Checkin[]>();
  for (const c of sortedCheckins(issue)) {
    const key = localDateKey(c.at);
    const list = byDay.get(key);
    if (list) list.push(c);
    else byDay.set(key, [c]);
  }

  return dayKeys.map((date) => {
    const checkins = byDay.get(date) ?? [];
    const magnitudes = checkins.filter((c) => isMagnitude(c.status));
    const resolved = checkins.findLast((c) => c.status === "resolved");
    return {
      date,
      ongoing: spans.some(
        (s) => s.from <= date && (s.to === null || date <= s.to),
      ),
      magnitude: (magnitudes.at(-1)?.status as MagnitudeStatus) ?? null,
      multipleMagnitudes: magnitudes.length > 1,
      onset: checkins.some(
        (c) => c.status === "start" || c.status === "relapse",
      ),
      resolved: resolved
        ? resolved.resolvedDateUnknown
          ? "unknown"
          : "known"
        : null,
      checkins,
    };
  });
}

/**
 * 推移に出す症状の帯。期間中にエピソードが続いていたか、エントリがある症状だけを、
 * 最新のエントリが新しい順に並べる(今日タブと同じ順)。気にしない症状は出さない
 * (経過を追うのをやめた症状なので、見渡す対象からも外す)。
 */
export function trendRows(issues: Issue[], dayKeys: string[]): TrendRow[] {
  return issues
    .filter((issue) => !issue.dismissedAt)
    .map((issue) => ({ issue, days: trendDays(issue, dayKeys) }))
    .filter((row) => row.days.some((d) => d.ongoing || d.checkins.length > 0))
    .sort((a, b) => {
      const la = latestCheckinAt(a.issue);
      const lb = latestCheckinAt(b.issue);
      return la < lb ? 1 : la > lb ? -1 : a.issue.id.localeCompare(b.issue.id);
    });
}
