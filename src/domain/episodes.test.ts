import { describe, expect, it } from "vitest";
import {
  createIssue,
  addCheckin,
  resolveIssue,
  relapseIssue,
  deleteCheckinsOnDate,
} from "./operations";
import {
  deriveEpisodes,
  deriveStatus,
  currentEpisode,
  currentEpisodeDays,
  diseaseSpan,
  firstOnsetKey,
} from "./episodes";
import { daysBetween, inclusiveDayCount, localDateKey } from "./time";

// tz非依存にするため、Zを付けないローカルISOで組み立てる。
const at = (d: string, t = "09:00:00") => `${d}T${t}`;

describe("time", () => {
  it("daysBetween は両端の差(日)", () => {
    expect(daysBetween("2026-08-14", "2026-08-17")).toBe(3);
    expect(daysBetween("2026-08-17", "2026-08-14")).toBe(-3);
  });
  it("inclusiveDayCount は◯日目(両端含む)", () => {
    expect(inclusiveDayCount("2026-08-14", "2026-08-17")).toBe(4);
    expect(inclusiveDayCount("2026-08-14", "2026-08-14")).toBe(1);
  });
  it("localDateKey はローカル日付", () => {
    expect(localDateKey(at("2026-08-03"))).toBe("2026-08-03");
  });
});

describe("新規症状(1エピソード・継続中)", () => {
  const issue = createIssue("頭痛", at("2026-08-14"));

  it("start エントリを1件持ち active", () => {
    expect(issue.checkins).toHaveLength(1);
    expect(issue.checkins[0].status).toBe("start");
    expect(deriveStatus(issue)).toBe("active");
  });

  it("1エピソード・initial・未クローズ", () => {
    const eps = deriveEpisodes(issue);
    expect(eps).toHaveLength(1);
    expect(eps[0].kind).toBe("initial");
    expect(eps[0].closed).toBe(false);
    expect(eps[0].durationDays).toBeNull();
  });

  it("現在エピソード経過日数は◯日目(8/14→8/17=4)", () => {
    const now = new Date(at("2026-08-17", "10:00:00"));
    expect(currentEpisodeDays(issue, now)).toBe(4);
  });
});

describe("片頭痛の再発シナリオ(モデルA)", () => {
  // 8/3発症→8/4悪化→8/5変わらず→8/6改善→8/7治癒、8/14再発→8/15悪化
  let issue = createIssue("頭痛", at("2026-08-03"));
  issue = addCheckin(issue, "worse", { at: at("2026-08-04") });
  issue = addCheckin(issue, "same", { at: at("2026-08-05") });
  issue = addCheckin(issue, "better", { at: at("2026-08-06") });
  issue = resolveIssue(issue, at("2026-08-07"));
  issue = relapseIssue(issue, at("2026-08-14"));
  issue = addCheckin(issue, "worse", { at: at("2026-08-15") });

  const now = new Date(at("2026-08-17", "10:00:00"));

  it("エピソードは2つ(initial + relapse)", () => {
    const eps = deriveEpisodes(issue);
    expect(eps).toHaveLength(2);
    expect(eps[0].kind).toBe("initial");
    expect(eps[1].kind).toBe("relapse");
  });

  it("第1エピソードは閉じて期間5日(8/3〜8/7)", () => {
    const eps = deriveEpisodes(issue);
    expect(eps[0].closed).toBe(true);
    expect(eps[0].durationDays).toBe(5);
  });

  it("第2エピソードは継続中で、現在の経過は4日目(8/14→8/17)", () => {
    const eps = deriveEpisodes(issue);
    expect(eps[1].closed).toBe(false);
    expect(currentEpisode(issue)?.startAt).toBe(at("2026-08-14"));
    expect(currentEpisodeDays(issue, now)).toBe(4);
  });

  it("現在は active", () => {
    expect(deriveStatus(issue)).toBe("active");
  });

  it("罹病スパンは 8/3 から・断続的・15日", () => {
    const span = diseaseSpan(issue, now)!;
    expect(span.fromKey).toBe("2026-08-03");
    expect(span.intermittent).toBe(true);
    expect(span.episodeCount).toBe(2);
    expect(span.days).toBe(15); // 8/3〜8/17 通日
    expect(firstOnsetKey(issue)).toBe("2026-08-03");
  });
});

describe("治癒後の状態", () => {
  it("resolved を最後に打つと resolved・現在エピソードなし", () => {
    let issue = createIssue("風邪", at("2026-08-01"));
    issue = resolveIssue(issue, at("2026-08-05"));
    expect(deriveStatus(issue)).toBe("resolved");
    expect(currentEpisode(issue)).toBeNull();
    expect(currentEpisodeDays(issue)).toBeNull();
  });
});

describe("操作は不変(元を壊さない)", () => {
  it("addCheckin は元の issue を変更しない", () => {
    const issue = createIssue("腰痛", at("2026-08-10"));
    const before = issue.checkins.length;
    const next = addCheckin(issue, "worse", { at: at("2026-08-11") });
    expect(issue.checkins).toHaveLength(before);
    expect(next.checkins).toHaveLength(before + 1);
    expect(next).not.toBe(issue);
  });
});

describe("ある日の記録をまとめて削除", () => {
  it("指定日のエントリだけ消え、他の日は残る", () => {
    let issue = createIssue("頭痛", at("2026-08-10"));
    issue = addCheckin(issue, "worse", { at: at("2026-08-11", "09:00:00") });
    issue = addCheckin(issue, "memo", {
      at: at("2026-08-11", "20:00:00"),
      note: "病院",
    });
    issue = addCheckin(issue, "better", { at: at("2026-08-12") });
    expect(issue.checkins).toHaveLength(4);

    const after = deleteCheckinsOnDate(issue, "2026-08-11");
    expect(after.checkins).toHaveLength(2);
    expect(after.checkins.map((c) => c.status)).toEqual(["start", "better"]);
  });
});

describe("中立のメモ(memo)", () => {
  it("状態を変えず(active のまま)、現在エピソードに含まれる", () => {
    let issue = createIssue("腰痛", at("2026-08-10"));
    issue = addCheckin(issue, "memo", {
      at: at("2026-08-11"),
      note: "病院に行った",
    });
    expect(deriveStatus(issue)).toBe("active");
    const eps = deriveEpisodes(issue);
    expect(eps).toHaveLength(1);
    expect(eps[0].checkins.map((c) => c.status)).toEqual(["start", "memo"]);
  });
});
