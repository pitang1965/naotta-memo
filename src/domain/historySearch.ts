import type { Checkin, HistorySortOrder, Issue } from "./types";
import { localDateKey } from "./time";

export interface HistoryDateRange {
  from: string;
  to: string;
}

export function isInHistoryRange(
  checkin: Checkin,
  range: HistoryDateRange,
): boolean {
  const date = localDateKey(checkin.at);
  return (!range.from || date >= range.from) && (!range.to || date <= range.to);
}

/** 元の症状は変更せず、期間内の記録と検索語が一致する症状を選ぶ。 */
export function matchesHistorySearch(
  issue: Issue,
  query: string,
  range: HistoryDateRange,
): boolean {
  const text = query.trim().toLowerCase();
  const nameMatches = issue.name.toLowerCase().includes(text);
  return issue.checkins.some(
    (checkin) =>
      isInHistoryRange(checkin, range) &&
      (nameMatches || checkin.note.toLowerCase().includes(text)),
  );
}

/** 表示する期間の記録日で並べる。編集には必ず元の Issue を渡す。 */
export function searchHistory(
  issues: Issue[],
  query: string,
  range: HistoryDateRange,
  order: HistorySortOrder = "newest",
) {
  return issues
    .filter((issue) => matchesHistorySearch(issue, query, range))
    .map((issue) => {
      const checkins = issue.checkins.filter((c) => isInHistoryRange(c, range));
      const latest = checkins.reduce((a, b) =>
        new Date(a.at).getTime() >= new Date(b.at).getTime() ? a : b,
      );
      return { issue, latestAt: latest.at, recordCount: checkins.length };
    })
    .sort(
      (a, b) =>
        (new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime()) *
          (order === "oldest" ? -1 : 1) || a.issue.id.localeCompare(b.issue.id),
    );
}
