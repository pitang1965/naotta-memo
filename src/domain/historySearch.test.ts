import { describe, expect, it } from "vitest";
import {
  isInHistoryRange,
  matchesHistorySearch,
  searchHistory,
} from "./historySearch";
import { parseCsv, rowsToIssues } from "@/lib/csvImport";
import { editCheckin } from "./operations";
import type { Issue } from "./types";

const issue: Issue = {
  id: "issue",
  name: "頭痛",
  checkins: [
    {
      id: "before",
      at: "2026-08-31T12:00:00",
      status: "start",
      note: "以前のメモ",
    },
    {
      id: "first",
      at: "2026-09-01T00:00:00",
      status: "same",
      note: "朝の記録",
    },
    {
      id: "last",
      at: "2026-09-02T23:59:59",
      status: "better",
      note: "Clinicで相談",
    },
    { id: "after", at: "2026-09-03T00:00:00", status: "resolved", note: "" },
  ],
};
const range = { from: "2026-09-01", to: "2026-09-02" };

describe("履歴の期間検索", () => {
  it("同じ期間・検索結果を新しい順と古い順に切り替える", () => {
    const earlier = { ...issue, id: "earlier", checkins: [issue.checkins[1]] };
    const later = { ...issue, id: "later", checkins: [issue.checkins[2]] };
    const input = [later, earlier];
    expect(searchHistory(input, "頭痛", range).map((r) => r.issue.id)).toEqual([
      "later",
      "earlier",
    ]);
    expect(
      searchHistory(input, "頭痛", range, "oldest").map((r) => r.issue.id),
    ).toEqual(["earlier", "later"]);
    expect(input).toEqual([later, earlier]);
  });
  it("初回発症が古いCSVでも、期間内の記録日を表示・並び替えに使う", () => {
    const imported = rowsToIssues(
      parseCsv(
        [
          "症状名,日付,状態,メモ",
          "蕁麻疹,2009/11/6,発症,過去の発症",
          "蕁麻疹,2026/2/1,再発,期間内",
          "蕁麻疹,2026/9/1,メモ,期間外の最新記録",
        ].join("\n"),
      ).rows,
    );
    const newer = rowsToIssues(
      parseCsv(
        ["症状名,日付,状態,メモ", "蕁麻疹,2026/5/1,発症,別の取り込み"].join(
          "\n",
        ),
      ).rows,
    );
    const results = searchHistory([...imported, ...newer], "蕁麻疹", {
      from: "2026-01-01",
      to: "2026-08-31",
    });
    expect(results.map((r) => r.issue.id)).toEqual([
      newer[0].id,
      imported[0].id,
    ]);
    expect(results.map((r) => r.recordCount)).toEqual([1, 1]);
    expect(new Date(results[1].latestAt).getTime()).toBe(
      new Date(2026, 1, 1, 12).getTime(),
    );
    expect(results[1].issue).toBe(imported[0]);
    expect(results[1].issue.checkins).toHaveLength(3);
    expect(
      searchHistory(imported, "過去の発症", { from: "2026-01-01", to: "" }),
    ).toEqual([]);
  });

  it("取り込み行の順序や時差表記に依存せず日時で並べる", () => {
    const first: Issue = {
      id: "a",
      name: "症状",
      checkins: [
        {
          id: "a1",
          at: "2026-09-02T00:30:00+09:00",
          status: "start",
          note: "",
        },
        { id: "a2", at: "2026-09-01T01:00:00Z", status: "same", note: "" },
      ],
    };
    const second: Issue = {
      id: "b",
      name: "症状",
      checkins: [
        { id: "b1", at: "2026-09-01T16:00:00Z", status: "start", note: "" },
      ],
    };
    const results = searchHistory([first, second], "", { from: "", to: "" });
    expect(results.map((r) => r.issue.id)).toEqual(["b", "a"]);
    expect(results[1].latestAt).toBe(first.checkins[0].at);
    expect(searchHistory([], "", { from: "", to: "" })).toEqual([]);
  });

  it("端末の日付で両端の日を含み、期間外を除外する", () => {
    expect(
      issue.checkins.filter((c) => isInHistoryRange(c, range)).map((c) => c.id),
    ).toEqual(["first", "last"]);
    const localMidnight = {
      ...issue.checkins[1],
      at: new Date(2026, 8, 1, 0, 0).toISOString(),
    };
    expect(isInHistoryRange(localMidnight, range)).toBe(true);
  });

  it("開始日だけ・終了日だけ・期間指定なしで検索できる", () => {
    expect(
      issue.checkins.filter((c) =>
        isInHistoryRange(c, { from: range.from, to: "" }),
      ),
    ).toHaveLength(3);
    expect(
      issue.checkins.filter((c) =>
        isInHistoryRange(c, { from: "", to: range.to }),
      ),
    ).toHaveLength(3);
    expect(matchesHistorySearch(issue, "", { from: "", to: "" })).toBe(true);
  });

  it("同じ日を両端に指定でき、逆転した期間には一致しない", () => {
    expect(
      issue.checkins.filter((c) =>
        isInHistoryRange(c, { from: range.from, to: range.from }),
      ),
    ).toHaveLength(1);
    expect(
      matchesHistorySearch(issue, "", { from: range.to, to: range.from }),
    ).toBe(false);
  });

  it("症状名または期間内のメモと検索語が一致する必要がある", () => {
    expect(matchesHistorySearch(issue, "頭痛", range)).toBe(true);
    expect(matchesHistorySearch(issue, " clinic ", range)).toBe(true);
    expect(matchesHistorySearch(issue, "以前", range)).toBe(false);
    expect(
      matchesHistorySearch(issue, "頭痛", { from: "2026-10-01", to: "" }),
    ).toBe(false);
  });

  it("検索後の編集でも期間外の記録を保持する", () => {
    const [result] = [issue].filter((i) =>
      matchesHistorySearch(i, "頭痛", range),
    );
    expect(result).toBe(issue);
    const edited = editCheckin(result, "first", { note: "訂正" });
    expect(edited.checkins).toHaveLength(4);
    expect(edited.checkins[0]).toEqual(issue.checkins[0]);
    expect(edited.checkins[3]).toEqual(issue.checkins[3]);
    expect(issue.checkins[1].note).toBe("朝の記録");
  });
});
