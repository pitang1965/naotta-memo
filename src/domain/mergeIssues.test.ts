import { describe, expect, it } from "vitest";
import { emptyAppData, mergeIssues } from "./operations";
import { deriveEpisodes, deriveStatus } from "./episodes";
import type { AppData, Issue } from "./types";

const first: Issue = {
  id: "first",
  name: "蕁麻疹",
  dismissedAt: "2026-01-04T00:00:00Z",
  checkins: [
    { id: "a", at: "2026-01-01T00:00:00Z", status: "start", note: "初回" },
    {
      id: "b",
      at: "2026-01-03T00:00:00Z",
      status: "resolved",
      note: "",
      resolvedDateUnknown: true,
    },
  ],
};
const later: Issue = {
  id: "later",
  name: "慢性的な蕁麻疹",
  checkins: [
    {
      id: "d",
      at: "2026-02-02T00:00:00Z",
      status: "memo",
      note: "通院",
      pressure: { hpa: 1000 },
    },
    { id: "c", at: "2026-02-01T00:00:00Z", status: "start", note: "再び" },
  ],
};
const other: Issue = { id: "other", name: "頭痛", checkins: [] };
const data: AppData = { ...emptyAppData(), issues: [later, other, first] };

describe("症状の統合", () => {
  it("日時順に統合し、後の発症を再発に変え、メモや付随データを保持する", () => {
    const before = structuredClone(data);
    const result = mergeIssues(data, ["later", "first"], " 蕁麻疹 ");
    expect(result.issues).toHaveLength(2);
    const merged = result.issues[0];
    expect(merged.name).toBe("蕁麻疹");
    expect(merged.checkins).toEqual([
      ...first.checkins,
      { ...later.checkins[1], status: "relapse" },
      later.checkins[0],
    ]);
    expect(merged.dismissedAt).toBeUndefined();
    expect(deriveEpisodes(merged).map((ep) => ep.kind)).toEqual([
      "initial",
      "relapse",
    ]);
    expect(deriveStatus(merged)).toBe("active");
    expect(result.issues[1]).toBe(other);
    expect(result.daily).toBe(data.daily);
    expect(result.settings).toBe(data.settings);
    expect(data).toEqual(before);
  });

  it("全症状が気にしない場合はその状態を保持する", () => {
    const dismissed = { ...later, dismissedAt: "2026-03-01T00:00:00Z" };
    const result = mergeIssues(
      { ...data, issues: [first, dismissed] },
      ["first", "later"],
      "蕁麻疹",
    );
    expect(result.issues[0].dismissedAt).toBe(dismissed.dismissedAt);
  });

  it("既存の再発と最新の治癒を維持する", () => {
    const resolved: Issue = {
      ...later,
      checkins: [
        { ...later.checkins[1], status: "relapse" },
        {
          id: "e",
          at: "2026-03-01T00:00:00Z",
          status: "resolved",
          note: "治った",
        },
      ],
    };
    const result = mergeIssues(
      { ...data, issues: [first, resolved] },
      ["first", "later"],
      "蕁麻疹",
    );
    expect(deriveStatus(result.issues[0])).toBe("resolved");
    expect(result.issues[0].checkins[2].status).toBe("relapse");
  });

  it("空の名前、選択不足、存在しないIDでは変更しない", () => {
    for (const ids of [
      [],
      ["first"],
      ["first", "first"],
      ["first", "later", "missing"],
    ]) {
      expect(mergeIssues(data, ids, "蕁麻疹")).toBe(data);
    }
    expect(mergeIssues(data, ["first", "later"], " ")).toBe(data);
  });
});
