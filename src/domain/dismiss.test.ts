import { describe, expect, it } from "vitest";
import {
  addCheckin,
  createIssue,
  dismissIssue,
  relapseIssue,
  resolveIssue,
  undismissIssue,
} from "@/domain/operations";
import { deriveStatus } from "@/domain/episodes";

const dismissed = () =>
  dismissIssue(
    createIssue("肩こり", "2026-08-01T09:00:00", ""),
    "2026-08-20T09:00:00",
  );

describe("気にしない", () => {
  it("状態(Status)は足さず、治癒扱いにもしない", () => {
    const i = dismissed();
    expect(i.dismissedAt).toBe("2026-08-20T09:00:00");
    expect(i.checkins).toHaveLength(1); // start のみ
    expect(deriveStatus(i)).toBe("active");
  });

  it("手動で解除できる", () => {
    expect(undismissIssue(dismissed()).dismissedAt).toBeUndefined();
  });

  it("memo 以外のチェックインを足すと自動で解除される", () => {
    for (const s of ["worse", "same", "better", "relapse", "start"] as const) {
      expect(addCheckin(dismissed(), s).dismissedAt).toBeUndefined();
    }
  });

  it("memo は解除しない(ADR 0006 と揃える)", () => {
    const i = addCheckin(dismissed(), "memo", { note: "領収書が出てきた" });
    expect(i.dismissedAt).toBe("2026-08-20T09:00:00");
  });

  it("治ったを記録しても解除される(治った症状へ移すため)", () => {
    expect(
      resolveIssue(dismissed(), "2026-08-25T09:00:00").dismissedAt,
    ).toBeUndefined();
  });

  it("治った日不明でも解除される", () => {
    expect(resolveIssue(dismissed(), null).dismissedAt).toBeUndefined();
  });

  it("再発でも解除される", () => {
    expect(
      relapseIssue(dismissed(), "2026-09-01T09:00:00").dismissedAt,
    ).toBeUndefined();
  });
});
