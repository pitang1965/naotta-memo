// OG 画像 (1200x630) と、マニフェスト shortcuts のアイコン (96)。
// 実行はリポジトリのルートから。
import { Resvg } from "@resvg/resvg-js";
import { writeFileSync } from "node:fs";
import { BG, INK, SHAPE, brushMaru } from "./shapes.mjs";

const TEXT = "#2B2E28"; // 墨 (--foreground)
const MUTED = "#6B6F64"; // 補助テキスト (--muted-foreground)
const RULE = "#DAD4C4"; // 罫線 (--border)

const MARU = brushMaru({ r: 19, ...SHAPE });

// 明朝でタイトルを組む。--font-serif の並びに合わせ Windows の游明朝 Demibold を使う。
// フォントを積んだ環境でしか走らないので、CI ではなく手元で焼いて成果物をコミットする。
const FONTS = ["C:/Windows/Fonts/yumindb.ttf", "C:/Windows/Fonts/yumin.ttf"];

const render = (svg, out, width) => {
  const png = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    font: {
      fontFiles: FONTS,
      loadSystemFonts: false,
      defaultFontFamily: "Yu Mincho Demibold",
    },
  })
    .render()
    .asPng();
  writeFileSync(out, png);
  console.log(`${out}  ${(png.length / 1024).toFixed(1)}KB`);
};

// --- OG 画像 -------------------------------------------------------------
// 中央寄せの縦組み。SNS 側で左右を切られても意味が落ちないようにしてある。
const markSize = 150;
const og = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <rect width="1200" height="630" fill="${BG}"/>
  <g transform="translate(${600 - markSize / 2} 118) scale(${markSize / 64})">
    <path d="${MARU}" fill="${INK}"/>
  </g>
  <text x="600" y="382" text-anchor="middle" font-family="Yu Mincho Demibold"
        font-size="84" font-weight="700" letter-spacing="6" fill="${TEXT}">なおったメモ</text>
  <text x="600" y="452" text-anchor="middle" font-family="Yu Mincho Demibold"
        font-size="31" fill="${MUTED}">症状のはじまりから「治った」まで記録する、個人用の体調メモ。</text>
  <text x="600" y="498" text-anchor="middle" font-family="Yu Mincho Demibold"
        font-size="31" fill="${MUTED}">通院のとき、まとめてそのまま見せられる。</text>
  <line x1="480" y1="548" x2="720" y2="548" stroke="${RULE}" stroke-width="2"/>
  <text x="600" y="592" text-anchor="middle" font-family="Yu Mincho Demibold"
        font-size="24" letter-spacing="1" fill="${MUTED}">naotta.over40web.club</text>
</svg>`;
render(og, "public/og.png", 1200);

// --- shortcuts のアイコン -------------------------------------------------
// ランチャーで円形に切り抜かれる前提。地は全面、字は中央 52% に収める。
const glyph = (
  paths,
) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
  <rect width="96" height="96" fill="${BG}"/>
  <g transform="translate(23 23) scale(${50 / 24})" fill="none" stroke="${INK}"
     stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
${paths.map((d) => `    <path d="${d}"/>`).join("\n")}
  </g>
</svg>`;

// lucide の Activity / History。BottomNav が使っているものと同じ字形。
render(
  glyph([
    "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2",
  ]),
  "public/shortcut-mood.png",
  96,
);

render(
  glyph([
    "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",
    "M3 3v5h5",
    "M12 7v5l4 2",
  ]),
  "public/shortcut-history.png",
  96,
);
