import { describe, expect, it } from "vitest";
import { parseCsv, rowsToIssues } from "@/lib/csvImport";

const CSV = [
  "症状名,日付,時刻,状態,メモ",
  '頭痛,2026-06-03,,発症,"ズキズキ, 右後頭部"',
  "頭痛,2026-06-04,,悪化,",
  "頭痛,2026-06-06,,治った,",
  "蕁麻疹,2026-05-01,15:00,メモ,病院に行った",
  "腰痛,2026-13-01,,発症,", // 月が不正
  "腰痛,2026-05-02,,ふらふら,", // 状態が不明
].join("\n");

describe("parseCsv", () => {
  const { headerError, rows } = parseCsv(CSV);

  it("ヘッダーは有効", () => {
    expect(headerError).toBeUndefined();
    expect(rows).toHaveLength(6);
  });

  it("クオート内のカンマを保ったままメモを読む", () => {
    expect(rows[0].status).toBe("start");
    expect(rows[0].note).toBe("ズキズキ, 右後頭部");
    expect(rows[0].valid).toBe(true);
  });

  it("日本語ラベルを状態コードに写す / 時刻を読む", () => {
    expect(rows[2].status).toBe("resolved");
    expect(rows[3].status).toBe("memo");
    expect(rows[3].time).toBe("15:00");
  });

  it("不正な日付・不明な状態は valid=false", () => {
    expect(rows[4].valid).toBe(false);
    expect(rows[4].error).toContain("日付");
    expect(rows[5].valid).toBe(false);
    expect(rows[5].error).toContain("状態");
  });

  it("状態が空ならメモ扱い", () => {
    const r = parseCsv("症状名,日付,状態\n頭痛,2026-06-03,").rows;
    expect(r[0].status).toBe("memo");
    expect(r[0].valid).toBe(true);
  });

  it("必須ヘッダーが無ければ headerError", () => {
    const res = parseCsv("日付,状態\n2026-06-03,発症");
    expect(res.headerError).toContain("症状名");
    expect(res.rows).toHaveLength(0);
  });
});

describe("rowsToIssues", () => {
  it("同名を1スレッドに束ね、valid のみ取り込む", () => {
    const { rows } = parseCsv(CSV);
    const issues = rowsToIssues(rows);
    // 頭痛(3件)と 蕁麻疹(1件)。腰痛は2行とも不正で作られない。
    expect(issues.map((i) => i.name)).toEqual(["頭痛", "蕁麻疹"]);
    const headache = issues[0];
    expect(headache.checkins.map((c) => c.status)).toEqual([
      "start",
      "worse",
      "resolved",
    ]);
    expect(issues[1].checkins).toHaveLength(1);
    expect(issues[1].checkins[0].status).toBe("memo");
  });

  it("除外した行は取り込まれない", () => {
    const { rows } = parseCsv(CSV);
    rows[1].include = false; // 頭痛 8/4 悪化 を除外
    const issues = rowsToIssues(rows);
    expect(issues[0].checkins.map((c) => c.status)).toEqual([
      "start",
      "resolved",
    ]);
  });
});
