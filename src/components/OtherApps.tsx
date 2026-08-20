import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// 作者の他のアプリの紹介(設定タブのみ・控えめに)。広告ではなく正直な案内。
export function OtherApps() {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <h2 className="font-serif text-base font-semibold">作者の他のアプリ</h2>

        <a
          href="https://asatomo.nafuda.me/?intro=true"
          target="_blank"
          rel="noopener noreferrer"
          className="border-border hover:bg-accent/40 flex items-start justify-between gap-3 rounded-lg border p-3 transition-colors"
        >
          <div className="min-w-0">
            <p className="font-serif font-semibold">アサトモ</p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              一人暮らしの「今日も元気」を、そっと伝え合う。
            </p>
          </div>
          <ExternalLink className="text-muted-foreground mt-0.5 size-4 shrink-0" />
        </a>

        <p className="text-muted-foreground text-xs leading-relaxed">
          朝の目覚まし「アサトモ目覚まし」(Android)は
          <a
            href="https://asatomo.nafuda.me/beta"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            テスター募集中
          </a>
          です。
        </p>
      </CardContent>
    </Card>
  );
}
