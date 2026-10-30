import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

const source = readFileSync(
  new URL("../../public/sw.js", import.meta.url),
  "utf8",
);

function harness(fetch = vi.fn().mockRejectedValue(new TypeError("offline"))) {
  const listeners = new Map<string, (event: unknown) => void>();
  const cached = { old: true };
  const match = vi.fn().mockResolvedValue(cached);
  const cache = { addAll: vi.fn(), put: vi.fn() };
  runInNewContext(source, {
    URL,
    setTimeout,
    self: {
      addEventListener: (name: string, handler: (event: unknown) => void) =>
        listeners.set(name, handler),
      skipWaiting: vi.fn(),
    },
    caches: { match, open: vi.fn().mockResolvedValue(cache) },
    fetch,
  });
  const install = () => {
    const waitUntil = vi.fn();
    listeners.get("install")!({ waitUntil });
    return waitUntil.mock.calls[0][0] as Promise<void>;
  };
  const request = (pathname: string, destination = "script", mode = "no-cors") => {
    const respondWith = vi.fn();
    listeners.get("fetch")!({
      request: { url: `http://localhost:5173${pathname}`, destination, mode },
      respondWith,
      waitUntil: vi.fn(),
    });
    return respondWith;
  };
  return { request, install, match, cached, cache };
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

  it("ページを開くときにネットワークが失敗したらキャッシュを返す", async () => {
    const { request, match, cached } = harness();
    const respondWith = request("/history", "document", "navigate");
    expect(await respondWith.mock.calls[0][0]).toBe(cached);
    expect(match).toHaveBeenCalledOnce();
  });

  it("保存済みのページがなければトップページを返す", async () => {
    const { request, match, cached } = harness();
    match.mockResolvedValueOnce(undefined);
    const respondWith = request("/history", "document", "navigate");
    expect(await respondWith.mock.calls[0][0]).toBe(cached);
    expect(match).toHaveBeenLastCalledWith("/");
  });

  it("タイムアウトしてもキャッシュが空なら遅れて届く応答を待つ", async () => {
    vi.useFakeTimers();
    const late = { ok: false };
    const { request, match } = harness(
      vi.fn(() => new Promise((resolve) => setTimeout(() => resolve(late), 5000))),
    );
    match.mockResolvedValue(undefined);
    const respondWith = request("/history", "document", "navigate");
    await vi.advanceTimersByTimeAsync(5000);
    expect(await respondWith.mock.calls[0][0]).toBe(late);
    vi.useRealTimers();
  });

  it("インストール時に画面ごとの JS も含めて重複なく保存する", async () => {
    const res = (body: string) => ({ ok: true, text: async () => body, clone: () => res(body) });
    const page = res(
      '<link href="/assets/index-a.css"><script src="/assets/index-b.js"></script><link href="/assets/index-b.js">',
    );
    const fetch = vi.fn(async (url: string) =>
      url === "/" ? page : res('import("./history-c.js");mapDeps(["assets/history-c.js","assets/index-a.css"])'),
    );
    const { install, cache } = harness(fetch);
    await install();
    expect(cache.addAll).toHaveBeenCalledWith([
      "/assets/index-a.css",
      "/assets/index-b.js",
      "/assets/history-c.js",
    ]);
    expect(cache.put).toHaveBeenCalledWith("/", expect.anything());
  });
});
