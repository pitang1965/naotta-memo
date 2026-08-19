import { describe, expect, it } from "vitest";
import {
  addCheckin,
  addIssue,
  createIssue,
  emptyAppData,
  relapseIssue,
  resolveIssue,
} from "@/domain/operations";
import { buildVisitExport } from "@/lib/visitExport";

const at = (d: string, t = "09:00:00") => `${d}T${t}`;
const now = new Date(at("2026-08-17", "10:00:00"));

function scenarioData() {
  // 頭痛: 8/3発症→…→8/7治癒、8/14再発→8/15悪化(継続中)
  let headache = createIssue("頭痛", at("2026-08-03"));
  headache = addCheckin(headache, "worse", { at: at("2026-08-04") });
  headache = addCheckin(headache, "same", { at: at("2026-08-05") });
  headache = addCheckin(headache, "better", { at: at("2026-08-06") });
  headache = resolveIssue(headache, at("2026-08-07"));
  headache = relapseIssue(headache, at("2026-08-14"));
  headache = addCheckin(headache, "worse", {
    at: at("2026-08-15"),
    note: "ズキズキ",
  });

  // 風邪: 8/1発症→8/5治癒
  let cold = createIssue("風邪", at("2026-08-01"));
  cold = resolveIssue(cold, at("2026-08-05"));

  let data = emptyAppData();
  data = addIssue(data, headache);
  data = addIssue(data, cold);
  return data;
}

describe("buildVisitExport", () => {
  const text = buildVisitExport(scenarioData(), now);

  it("見出しと時点を含む", () => {
    expect(text).toContain("体調記録(2026年8月17日 時点)");
    expect(text).toContain("■ 続いている症状");
    expect(text).toContain("■ 最近治った症状");
  });

  it("続いている症状は再発パターンと現エピソードの日数を要約する", () => {
    expect(text).toContain("・頭痛");
    expect(text).toContain("2026年8月3日から断続的(2回)。今回は8月14日から4日目。");
  });

  it("現エピソードの直近チェックインを M/D 状態[・メモ] で出す", () => {
    expect(text).toContain("8/14 再発");
    expect(text).toContain("8/15 悪化・ズキズキ");
  });

  it("治った症状は期間つきで出す", () => {
    expect(text).toContain("・風邪  8月1日〜8月5日(5日間)");
  });

  it("空データでも見出しと『なし』を出す", () => {
    const empty = buildVisitExport(emptyAppData(), now);
    expect(empty).toContain("■ 続いている症状");
    expect(empty).toContain("・なし");
  });
});
