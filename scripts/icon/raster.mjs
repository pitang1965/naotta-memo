// アイコンの PNG 一式。maskable は中間ファイルを置かず、その場で組んで焼く。
// 実行はリポジトリのルートから。
import { Resvg } from "@resvg/resvg-js";
import { writeFileSync } from "node:fs";
import { faviconSvg, maskableSvg } from "./shapes.mjs";

const render = (svg, out, size) => {
  const png = new Resvg(svg, {
    fitTo: { mode: "width", value: size },
  })
    .render()
    .asPng();
  writeFileSync(out, png);
  console.log(`${out}  ${size}x${size}  ${(png.length / 1024).toFixed(1)}KB`);
};

const favicon = faviconSvg();

// apple-touch-icon が無いと iOS のホーム画面はアイコンではなくページの
// スクリーンショットを使ってしまう。
render(favicon, "public/apple-touch-icon.png", 180);
render(favicon, "public/icon-192.png", 192);
render(favicon, "public/icon-512.png", 512);
render(maskableSvg(), "public/icon-maskable-512.png", 512);
