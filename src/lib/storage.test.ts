import { afterEach, describe, expect, it, vi } from "vitest";
import { loadAppData, STORAGE_KEY, StorageCorruptError } from "./storage";

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
