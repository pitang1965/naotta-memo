import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

/**
 * 存在しないURLに来たときの画面(router.tsx の defaultNotFoundComponent)。
 *
 * _redirects が全URLを index.html に流すので、打ち間違いも QR の読み損ねも
 * すべてここに落ちる。人にURLを渡すようになった以上、初見の人が最初に見る画面に
 * なりうるため、ライブラリ既定の "Not Found" 一行では済ませない。
 */
export function NotFound() {
  return (
    <div className="bg-background flex min-h-dvh flex-col items-center justify-center px-4 pt-10 pb-24">
      <div className="bg-card border-border w-full max-w-md rounded-2xl border p-6 text-center shadow-sm sm:p-8">
        <p className="text-muted-foreground font-serif text-sm tracking-widest">
          404
        </p>
        <h1 className="text-foreground mt-2 font-serif text-xl font-bold">
          ページが見つかりません
        </h1>
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          URL が変わったか、打ち間違いかもしれません。
          <br />
          記録は端末の中に残っているので、消えてはいません。
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <Button asChild>
            <Link to="/">今日の記録へ</Link>
          </Button>
          {/* 紹介ページはルーターの外(静的HTML)なので、Link ではなく素の <a>。 */}
          <Button asChild variant="outline">
            <a href="/about">なおったメモについて</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
