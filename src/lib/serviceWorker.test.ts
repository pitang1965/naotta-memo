import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

const source = readFileSync(
  new URL("../../public/sw.js", import.meta.url),
  "utf8",
);

function harness() {
  const listeners = new Map<string, (event: unknown) => void>();
  const cached = { old: true };
  const match = vi.fn().mockResolvedValue(cached);
  runInNewContext(source, {
    URL,
    self: {
      addEventListener: (name: string, handler: (event: unknown) => void) =>
        listeners.set(name, handler),
    },
    caches: { match },
  });
  const request = (pathname: string, destination = "script") => {
    const respondWith = vi.fn();
    listeners.get("fetch")!({
      request: { url: `http://localhost:5173${pathname}`, destination },
      respondWith,
    });
    return respondWith;
  };
  return { request, match, cached };
}

describe("Service Worker のコードキャッシュ", () => {
  it("古いキャッシュがあっても開発用の React・ソースを配信しない", () => {
    const { request, match } = harness();
    for (const path of [
      "/src/routes/history.tsx",
      "/node_modules/.vite/deps/react.js?v=old",
      "/@vite/client",
      "/@react-refresh",
    ]) {
      expect(request(path)).not.toHaveBeenCalled();
    }
    expect(request("/src/index.css", "style")).not.toHaveBeenCalled();
    expect(match).not.toHaveBeenCalled();
  });

  it("ビルド済みアセットのオフライン用キャッシュは使う", async () => {
    const { request, match, cached } = harness();
    const respondWith = request("/assets/index-abc123.js");
    expect(match).toHaveBeenCalledOnce();
    expect(await respondWith.mock.calls[0][0]).toBe(cached);
  });
});
