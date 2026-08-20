// 治癒を祝う演出のトリガー。どこからでも celebrate() を呼ぶと、
// __root に置いた <Celebration /> が受け取って紙吹雪を出す(疎結合)。

export const CELEBRATE_EVENT = "naotta:celebrate";

export function celebrate(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CELEBRATE_EVENT));
  }
}
