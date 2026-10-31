import { afterEach, describe, expect, it, vi } from "vitest";
import { emptyAppData } from "@/domain/operations";
import {
  loadAppData,
  saveAppData,
  STORAGE_KEY,
  StorageCorruptError,
} from "./storage";

afterEach(() => vi.unstubAllGlobals());

describe("loadAppData", () => {
  it("壊れた JSON は null ではなく StorageCorruptError を投げる(空データで上書きさせない)", () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => (key === STORAGE_KEY ? "{壊れ" : null),
    });
    expect(() => loadAppData()).toThrow(StorageCorruptError);
  });
});

describe("saveAppData", () => {
  it("容量超過で書けなければ例外を投げずに false を返す(画面を落とさない)", () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", {
      setItem: () => {
        throw new DOMException("full", "QuotaExceededError");
      },
    });
    expect(saveAppData(emptyAppData())).toBe(false);
  });
});
