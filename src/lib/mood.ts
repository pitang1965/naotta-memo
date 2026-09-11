import type { Mood } from "@/domain/types";

// 絶好調 → つらい を、緑→黄土→赤 の重症度ランプで。不調の連なりが赤で見える。
// 同じランプを塗り(推移のマス・凡例)と線(顔のイラスト)の二形で持つ。
// 別々の場所に散らすと、片方だけ直して色がずれるので一箇所にまとめる。

/** 推移のマスや凡例の四角に使う塗り */
export const MOOD_COLOR: Record<Mood, string> = {
  great: "bg-primary",
  ok: "bg-primary/45",
  meh: "bg-amber-400 dark:bg-amber-500/80",
  bad: "bg-destructive",
};

/** 顔のイラストの線に使う色(細い線なので、塗りより濃いめに取る) */
export const MOOD_INK: Record<Mood, string> = {
  great: "text-primary",
  ok: "text-primary/75",
  meh: "text-amber-600 dark:text-amber-400",
  bad: "text-destructive",
};
