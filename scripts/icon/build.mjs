// 図形からソースへ書き出す: favicon.svg と、画面内で使う BrandMark.tsx。
// PNG は raster.mjs が担当する。実行はリポジトリのルートから。
import { writeFileSync } from "node:fs";
import { faviconSvg, markGeometry } from "./shapes.mjs";

writeFileSync("public/favicon.svg", faviconSvg());

const { d, viewBox } = markGeometry();
writeFileSync(
  "src/components/BrandMark.tsx",
  `// 「なおったメモ」のロゴマーク(筆の丸)。輪郭は scripts/icon/shapes.mjs で生成した実パス。
// viewBox はインクの外接矩形に一致させてあるので、要素の高さ = 丸の高さ。
// 余白を含まないぶん、置き場所での中央寄せがそのまま見た目の中央になる。
// 色は currentColor なので、置き場所のテキスト色クラスで決まる。
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="${viewBox}"
      className={className}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="${d}" />
    </svg>
  );
}
`,
);

console.log("public/favicon.svg\nsrc/components/BrandMark.tsx");
