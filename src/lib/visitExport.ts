// 通院用エクスポート(§2.6 / Q15)。
// 医者が数秒で読める要約: 症状ごとに 1〜2 行の要約(罹病スパン＋再発パターン)＋
// 現エピソードの直近5件。気圧・デイリームードは既定で含めない。
// これは整形(表示)の責務なのでドメインではなく lib に置き、labels を使う。

import type { AppData, Issue } from "@/domain/types";
import {
  currentEpisode,
  currentEpisodeDays,
  deriveEpisodes,
  deriveStatus,
  diseaseSpan,
  latestCheckinAt,
} from "@/domain/episodes";
import { localDateKey } from "@/domain/time";
import { STATUS_LABEL, jpDate, jpDateFull } from "@/lib/labels";

const RECENT_CHECKINS = 5;
const RECENT_RESOLVED = 5;

/** 日付キー → "M/D" */
function md(key: string): string {
  const [, m, d] = key.split("-");
  return `${Number(m)}/${Number(d)}`;
}

function byLatestDesc(a: Issue, b: Issue): number {
  return latestCheckinAt(a) < latestCheckinAt(b) ? 1 : -1;
}

function activeLines(issue: Issue, now: Date): string[] {
  const lines = [`・${issue.name}`];
  const span = diseaseSpan(issue, now);
  const ep = currentEpisode(issue);
  const days = currentEpisodeDays(issue, now);

  if (span && ep && days !== null) {
    const startKey = localDateKey(ep.startAt);
    if (span.episodeCount > 1) {
      lines.push(
        `  ${jpDateFull(span.fromKey)}から断続的(${span.episodeCount}回)。今回は${jpDate(startKey)}から${days}日目。`,
      );
    } else {
      lines.push(`  ${jpDateFull(span.fromKey)}から${days}日目、続いています。`);
    }

    const recent = ep.checkins.slice(-RECENT_CHECKINS).map((c) => {
      const label = STATUS_LABEL[c.status];
      const day = md(localDateKey(c.at));
      return c.note ? `${day} ${label}・${c.note}` : `${day} ${label}`;
    });
    if (recent.length) lines.push(`  ${recent.join(" / ")}`);
  }
  return lines;
}

function resolvedLine(issue: Issue): string {
  const eps = deriveEpisodes(issue);
  for (let i = eps.length - 1; i >= 0; i--) {
    const ep = eps[i];
    if (ep.closed && ep.endAt) {
      return `・${issue.name}  ${jpDate(localDateKey(ep.startAt))}〜${jpDate(
        localDateKey(ep.endAt),
      )}(${ep.durationDays}日間)`;
    }
  }
  return `・${issue.name}`;
}

/** 通院用のプレーンテキストを生成する */
export function buildVisitExport(data: AppData, now: Date = new Date()): string {
  const active = data.issues
    .filter((i) => deriveStatus(i) === "active")
    .sort(byLatestDesc);
  const resolved = data.issues
    .filter((i) => deriveStatus(i) === "resolved")
    .sort(byLatestDesc)
    .slice(0, RECENT_RESOLVED);

  const out: string[] = [];
  out.push(`体調記録(${jpDateFull(localDateKey(now))} 時点)`);
  out.push("");

  out.push("■ 続いている症状");
  if (active.length === 0) out.push("・なし");
  else for (const i of active) out.push(...activeLines(i, now));
  out.push("");

  out.push("■ 最近治った症状");
  if (resolved.length === 0) out.push("・なし");
  else for (const i of resolved) out.push(resolvedLine(i));

  return out.join("\n");
}
