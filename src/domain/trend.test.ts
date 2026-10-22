import { describe, expect, it } from "vitest";
import {
  addCheckin,
  createIssue,
  dismissIssue,
  relapseIssue,
  resolveIssue,
} from "./operations";
import { trendDays, trendRows } from "./trend";
import { addDays } from "./time";

// tz非依存にするため、Zを付けないローカルISOで組み立てる。
const at = (d: string, t = "09:00:00") => `${d}T${t}`;

/** from から n 日分の日付キー(古い順) */
const keys = (from: string, n: number) =>
  Array.from({ length: n }, (_, i) => addDays(from, i));

describe("trendDays", () => {
  it("記録の無い日も、エピソードの途中なら続いている", () => {
    const issue = createIssue("頭痛", at("2026-08-19"));
    const days = trendDays(issue, keys("2026-08-18", 4));
    expect(days.map((d) => d.ongoing)).toEqual([false, true, true, true]);
    expect(days[1].onset).toBe(true);
  });

  it("その日の代表は最新の経過エントリ。memo は数えない", () => {
    let issue = createIssue("頭痛", at("2026-08-19", "08:00:00"));
    issue = addCheckin(issue, "worse", { at: at("2026-08-20", "08:00:00") });
    issue = addCheckin(issue, "better", { at: at("2026-08-20", "19:00:00") });
    issue = addCheckin(issue, "memo", { at: at("2026-08-20", "21:00:00") });
    const [day] = trendDays(issue, ["2026-08-20"]);
    expect(day.magnitude).toBe("better");
    expect(day.multipleMagnitudes).toBe(true);
    expect(day.checkins).toHaveLength(3);
  });

  it("節目は最新でなくても拾う", () => {
    let issue = createIssue("頭痛", at("2026-08-19", "16:19:00"));
    issue = addCheckin(issue, "same", { at: at("2026-08-19", "19:41:00") });
    const [day] = trendDays(issue, ["2026-08-19"]);
    expect(day.onset).toBe(true);
    expect(day.magnitude).toBe("same");
    expect(day.multipleMagnitudes).toBe(false);
  });

  it("治癒した日までが続いていた日で、その後は治っている", () => {
    let issue = createIssue("頭痛", at("2026-08-19"));
    issue = resolveIssue(issue, at("2026-08-21"));
    const days = trendDays(issue, keys("2026-08-19", 4));
    expect(days.map((d) => d.ongoing)).toEqual([true, true, true, false]);
    expect(days[2].resolved).toBe("known");
  });

  it("治った日不明なら、最後に記録した日で止めて印を置く", () => {
    let issue = createIssue("頭痛", at("2026-08-19"));
    issue = addCheckin(issue, "better", { at: at("2026-08-22") });
    issue = resolveIssue(issue, null);
    const days = trendDays(issue, keys("2026-08-21", 4));
    expect(days.map((d) => d.ongoing)).toEqual([true, true, false, false]);
    expect(days[1].resolved).toBe("unknown");
  });

  it("再発でまた続き始める", () => {
    let issue = createIssue("頭痛", at("2026-08-19"));
    issue = resolveIssue(issue, at("2026-08-20"));
    issue = relapseIssue(issue, at("2026-08-23"));
    const days = trendDays(issue, keys("2026-08-20", 5));
    expect(days.map((d) => d.ongoing)).toEqual([
      true,
      false,
      false,
      true,
      true,
    ]);
    expect(days[3].onset).toBe(true);
  });
});

describe("trendRows", () => {
  const range = keys("2026-09-01", 14);

  it("期間中に続いていた症状と記録のある症状だけを出す", () => {
    let healed = createIssue("腰痛", at("2026-08-01"));
    healed = resolveIssue(healed, at("2026-08-05"));
    let noted = createIssue("蕁麻疹", at("2026-08-01"));
    noted = resolveIssue(noted, at("2026-08-05"));
    noted = addCheckin(noted, "memo", { at: at("2026-09-03") });
    const ongoing = createIssue("頭痛", at("2026-08-20"));

    const rows = trendRows([healed, noted, ongoing], range);
    expect(rows.map((r) => r.issue.name)).toEqual(["蕁麻疹", "頭痛"]);
  });

  it("最新のエントリが新しい順。気にしない症状も出す", () => {
    const older = dismissIssue(createIssue("頭痛", at("2026-09-02")));
    const newer = createIssue("咳", at("2026-09-05"));
    const rows = trendRows([older, newer], range);
    expect(rows.map((r) => r.issue.name)).toEqual(["咳", "頭痛"]);
  });
});
