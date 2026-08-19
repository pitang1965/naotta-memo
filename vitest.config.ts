import { defineConfig } from "vitest/config";
import path from "node:path";

// テストは純ドメインロジック(src/domain)と整形(src/lib)を対象にする。
// アプリの vite.config.ts(Cloudflare / TanStack Start プラグイン)は読み込まない。
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
