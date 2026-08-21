// 「なおったメモ」のアイコンの原型。ここが図形の唯一の出どころで、
// build.mjs / raster.mjs / og.mjs はこれを書き出し先ごとに包むだけ。

export const BG = "#F2F0EA"; // 和紙 (--background)
export const INK = "#4E8259"; // 改善・治癒の緑 (--primary)

const C = 32; // 64 の canvas の中心

// 筆の丸(円相)。線幅を角度に沿って変えた輪郭を実パスとして生成する。
// 終筆だけが輪の外側へ逃げて始点の上を通り過ぎるので、内側の輪郭に段差が出ず、
// 「一筆で書いて筆を抜いた丸」に見える。小さいサイズでは払いが消えて素直な太い丸になる。
export function brushMaru({
  r,
  a0,
  sweep,
  wStart,
  wPeak,
  wEnd,
  peakAt = 0.3,
  flickFrom = 0.75,
  flickTo = 6.5,
  squash = 0.975,
  tilt = -7,
  n = 300,
  decimals = 2,
}) {
  const width = (t) =>
    t < peakAt
      ? wStart + (wPeak - wStart) * (t / peakAt)
      : wPeak + (wEnd - wPeak) * ((t - peakAt) / (1 - peakAt));
  // 最後だけ外へ払う。それ以外は一定半径。
  const offset = (t) =>
    t < flickFrom ? 0 : flickTo * ((t - flickFrom) / (1 - flickFrom)) ** 1.6;

  const th = (tilt * Math.PI) / 180;
  const pt = (a, rad) => {
    const s = (a * Math.PI) / 180;
    const x = rad * Math.cos(s),
      y = rad * squash * Math.sin(s);
    return [
      C + x * Math.cos(th) - y * Math.sin(th),
      C + x * Math.sin(th) + y * Math.cos(th),
    ];
  };

  const out = [],
    inn = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const rad = r + offset(t);
    const hw = width(t) / 2;
    out.push(pt(a0 + sweep * t, rad + hw));
    inn.push(pt(a0 + sweep * t, rad - hw));
  }
  const f = ([x, y]) => `${x.toFixed(decimals)},${y.toFixed(decimals)}`;
  return (
    `M${f(out[0])}` +
    out
      .slice(1)
      .map((p) => `L${f(p)}`)
      .join("") +
    inn
      .reverse()
      .map((p) => `L${f(p)}`)
      .join("") +
    "Z"
  );
}

export const SHAPE = { a0: -78, sweep: 400, wStart: 4.0, wPeak: 9.6, wEnd: 1.4 };

const wrap = (bg, d) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  ${bg}
  <path d="${d}" fill="${INK}"/>
</svg>
`;

// 通常アイコン: 角丸の生成り地。
export const faviconSvg = () =>
  wrap(
    `<rect width="64" height="64" rx="12" fill="${BG}"/>`,
    brushMaru({ r: 19, ...SHAPE }),
  );

// maskable: 端は切り落とされる前提。地は全面、丸は中央 80% の安全域に収める。
export const maskableSvg = () =>
  wrap(
    `<rect width="64" height="64" fill="${BG}"/>`,
    brushMaru({
      r: 14.5,
      ...SHAPE,
      wStart: 3.1,
      wPeak: 7.4,
      wEnd: 1.1,
      flickTo: 5.0,
    }),
  );

// 画面内のロゴマーク: 24px 前後でしか使わないので点は粗くてよい。
// アイコンと違い viewBox をインクの外接矩形ぴったり(正方形)に切り詰める。
// こうすると要素の寸法 = 見えている丸の寸法になり、CSS 側で素直に中央寄せできる。
export function markGeometry() {
  const d = brushMaru({ r: 19, ...SHAPE, n: 110, decimals: 1 });
  const nums = d.match(/-?\d+(?:\.\d+)?/g).map(Number);
  const xs = nums.filter((_, i) => i % 2 === 0);
  const ys = nums.filter((_, i) => i % 2 === 1);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const size = Math.max(
    Math.max(...xs) - Math.min(...xs),
    Math.max(...ys) - Math.min(...ys),
  );
  const viewBox = [cx - size / 2, cy - size / 2, size, size]
    .map((v) => v.toFixed(2))
    .join(" ");
  return { d, viewBox };
}
