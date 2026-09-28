// TanStack Start はハイドレーション用のインラインスクリプト($tsr-stream-barrier・
// スクロール復元)を prerender 時に埋め込む。中身はビルドのたびに変わる(アセット
// ハッシュ・タイムスタンプ)ため、CSP の script-src には 'unsafe-inline' ではなく
// ビルド成果物から実測した sha256 ハッシュを都度差し込む(deploy:cf から実行)。
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const distDir = path.resolve(import.meta.dirname, "..", "dist", "client");
const html = await readFile(path.join(distDir, "index.html"), "utf8");

// src 属性を持たない <script> だけがインライン実行対象(外部スクリプトはハッシュ不要)。
const inlineScriptPattern = /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g;
const hashes = new Set();
for (const match of html.matchAll(inlineScriptPattern)) {
  const content = match[1];
  if (!content.trim()) continue;
  const digest = createHash("sha256").update(content, "utf8").digest("base64");
  hashes.add(`'sha256-${digest}'`);
}

if (hashes.size === 0) {
  throw new Error(
    "インラインスクリプトが見つからなかった。TanStack Start の出力形式が変わっていないか確認してください。",
  );
}

const headersPath = path.join(distDir, "_headers");
let headers = await readFile(headersPath, "utf8");

const scriptSrcPattern = /script-src [^;]+;/;
if (!scriptSrcPattern.test(headers)) {
  throw new Error("_headers に script-src ディレクティブが見つからなかった。");
}

headers = headers.replace(
  scriptSrcPattern,
  `script-src 'self' ${[...hashes].join(" ")} https://static.cloudflareinsights.com;`,
);

await writeFile(headersPath, headers);
console.log(`[csp] script-src に ${hashes.size} 件のインラインスクリプトハッシュを差し込みました。`);
