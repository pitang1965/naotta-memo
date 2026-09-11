import type { Mood } from "@/domain/types";
import { MOOD_INK } from "@/lib/mood";
import { cn } from "@/lib/utils";

// 4段階の顔。線だけで描き、色は重症度ランプ(MOOD_INK)に乗せる。
// 絶好調=笑った目と大きな口、普通=まる目と控えめな笑み、だるい=半目と真一文字、
// つらい=八の字の眉と への字の口。記号(◎○△✕)より先に、表情で分かるように。
const FACE: Record<Mood, React.ReactNode> = {
  great: (
    <>
      <path d="M7.7 10.7c.6-1.3 1.9-1.3 2.5 0" />
      <path d="M13.8 10.7c.6-1.3 1.9-1.3 2.5 0" />
      <path d="M7.6 13.3c1.6 3 7.2 3 8.8 0" />
    </>
  ),
  ok: (
    <>
      <circle cx="9.2" cy="10.4" r=".95" fill="currentColor" stroke="none" />
      <circle cx="14.8" cy="10.4" r=".95" fill="currentColor" stroke="none" />
      <path d="M9 14.2c1.2 1.5 4.8 1.5 6 0" />
    </>
  ),
  meh: (
    <>
      <path d="M7.7 10.6h2.6" />
      <path d="M13.7 10.6h2.6" />
      <path d="M9 14.9h6" />
    </>
  ),
  bad: (
    <>
      <path d="M7.6 9.9l2.6-1.1" />
      <path d="M16.4 9.9l-2.6-1.1" />
      <circle cx="9.5" cy="11.4" r=".95" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="11.4" r=".95" fill="currentColor" stroke="none" />
      <path d="M9 15.6c1.2-1.7 4.8-1.7 6 0" />
    </>
  ),
};

/** 今日の調子の顔。既定の大きさは size-6、置き場所で className から変えられる。 */
export function MoodFace({
  mood,
  className,
}: {
  mood: Mood;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-6", MOOD_INK[mood], className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="9.1" />
      {FACE[mood]}
    </svg>
  );
}
