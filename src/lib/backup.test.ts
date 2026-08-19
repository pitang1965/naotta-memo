import { describe, expect, it } from "vitest";
import {
  addCheckin,
  addIssue,
  createIssue,
  emptyAppData,
  upsertMood,
} from "@/domain/operations";
import { backupFilename, parseBackup } from "@/lib/backup";

function sample() {
  let d = emptyAppData();
  let issue = createIssue("頭痛", "2026-08-03T09:00:00", "初期メモ");
  issue = addCheckin(issue, "worse", { at: "2026-08-04T09:00:00", note: "痛い" });
  d = addIssue(d, issue);
  d = upsertMood(d, "2026-08-04", "meh");
  return d;
}

describe("parseBackup", () => {
  it("エクスポート→インポートで往復して一致する", () => {
    const data = sample();
    const text = JSON.stringify(data);
    expect(parseBackup(text)).toEqual(data);
  });

  it("version 欠落は既定で補う", () => {
    const parsed = parseBackup(
      JSON.stringify({ issues: [], daily: [], settings: {} }),
    );
    expect(parsed.version).toBe(1);
  });

  it("不正な JSON は例外", () => {
    expect(() => parseBackup("{壊れた")).toThrow();
  });

  it("構造が不正(issues 欠落)なら例外", () => {
    expect(() => parseBackup(JSON.stringify({ daily: [] }))).toThrow();
  });

  it("未知の状態値は弾く", () => {
    const bad = {
      version: 1,
      issues: [
        { id: "x", name: "頭痛", checkins: [{ id: "c", at: "t", status: "bogus", note: "" }] },
      ],
      daily: [],
      settings: {},
    };
    expect(() => parseBackup(JSON.stringify(bad))).toThrow();
  });
});

describe("backupFilename", () => {
  it("日付つきのファイル名", () => {
    const name = backupFilename(new Date("2026-08-09T10:00:00"));
    expect(name).toBe("naotta-memo-backup-20260809.json");
  });
  it("suffix つき", () => {
    const name = backupFilename(new Date("2026-08-09T10:00:00"), "before-import");
    expect(name).toBe("naotta-memo-backup-20260809-before-import.json");
  });
});
