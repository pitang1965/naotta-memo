// 紹介ページ(/about)を開く QR コード。実行はリポジトリのルートから。
//
// URL は固定で二度と変わらないので、実行時ではなくここで焼いて成果物をコミットする
// (アイコン・OG 画像と同じ流儀 → ADR 0007)。アプリのバンドルには何も足さない。
import qrcode from "qrcode-generator";
import { writeFileSync } from "node:fs";

const URL = "https://naotta.over40web.club/about";

const DARK = "#2B2E28"; // 墨 (--ink / --foreground)
const LIGHT = "#FCFBF7"; // 生成り (--paper / --card)

// 誤り訂正は M。中央にロゴを置かないので H まで上げる必要がなく、
// 同じ大きさに刷ったときモジュールが粗いままで、遠く・斜めからでも読み取りやすい。
const EC_LEVEL = "M";
// 規格どおりの静穏帯(4 モジュール)。透過にはせず明るい地色を焼き込む。
// 紹介ページは prefers-color-scheme: dark に対応しているので、透過だと暗転して読めなくなる。
const QUIET = 4;

const qr = qrcode(0, EC_LEVEL); // 0 = 必要な型番を自動で選ぶ
qr.addData(URL);
qr.make();

const count = qr.getModuleCount();
const size = count + QUIET * 2;

// 暗モジュールをひとつのパスにまとめる(rect を並べるより小さく、描画も速い)。
let d = "";
for (let row = 0; row < count; row++) {
  for (let col = 0; col < count; col++) {
    if (qr.isDark(row, col)) d += `M${col + QUIET} ${row + QUIET}h1v1h-1z`;
  }
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size * 8}" height="${size * 8}" shape-rendering="crispEdges" role="img" aria-label="${URL} を開く QR コード">
<rect width="${size}" height="${size}" fill="${LIGHT}"/>
<path d="${d}" fill="${DARK}"/>
</svg>
`;

writeFileSync("public/qr.svg", svg);
console.log(`public/qr.svg (${count}x${count} モジュール, 誤り訂正 ${EC_LEVEL}) ← ${URL}`);
