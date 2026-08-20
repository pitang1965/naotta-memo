import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ContactEmail } from "@/components/ContactEmail";

// プライバシーポリシー(/privacy)。静的ページ。
// なおったメモの実態: アカウントなし・サーバーなし・解析なし・健康データは端末内(localStorage)のみ。
export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

const UPDATED = "2026年8月20日";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-7">
      <h2 className="border-border text-foreground mb-2 border-b pb-1.5 font-serif text-base font-semibold">
        {title}
      </h2>
      <div className="text-muted-foreground text-sm leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function PrivacyPage() {
  return (
    <div className="bg-background flex min-h-dvh justify-center px-4 pt-10 pb-16">
      <div className="bg-card border-border w-full max-w-2xl rounded-2xl border p-6 shadow-sm sm:p-8">
        <div className="mb-7">
          <Link to="/" className="text-primary text-xs hover:underline">
            ← トップに戻る
          </Link>
          <h1 className="text-foreground mt-4 mb-1 font-serif text-2xl font-bold">
            プライバシーポリシー
          </h1>
          <p className="text-muted-foreground m-0 text-xs">
            最終更新: {UPDATED}
          </p>
        </div>

        <Section title="1. 運営者">
          <p>
            名称: ピータン
            <br />
            お問い合わせ:{" "}
<ContactEmail />
          </p>
          <p className="mt-2">
            本サービス「なおったメモ」(以下「本アプリ」)の利用条件は
            <Link to="/terms" className="text-primary hover:underline">
              利用規約
            </Link>
            に定めています。
          </p>
        </Section>

        <Section title="2. 基本方針 — データは端末の中だけ">
          <p>
            本アプリで記録した体調・症状・調子・メモ・生年月日などの情報は、
            <strong className="text-foreground">
              すべてお使いの端末内(ブラウザのローカルストレージ)にのみ保存されます
            </strong>
            。運営者のサーバーや第三者へ送信・保存されることはありません。
            <strong className="text-foreground">
              アカウント登録・ログインもありません
            </strong>
            。センシティブな健康情報を扱うため、「常時クラウドに保存しない」ことを設計の前提としています。
          </p>
        </Section>

        <Section title="3. 運営者が集めない情報 / 集める情報">
          <p>
            運営者は、あなたの健康データや氏名・メールアドレス等の個人情報を
            <strong className="text-foreground">収集しません</strong>
            。アクセス解析ツールや広告も使用していません。
          </p>
          <p className="mt-2">
            ただし、本アプリは配信基盤として Cloudflare Pages
            を利用しており、ページの配信に伴い Cloudflare
            側で通信の技術的な記録(IPアドレス等の一般的なアクセスログ)が保持される場合があります。これは配信事業者の標準的な処理であり、運営者がこれをあなたの健康データと結びつけることはありません(そもそも健康データは端末内にしか存在しません)。
          </p>
        </Section>

        <Section title="4. データの保存場所と、消える条件">
          <p>
            記録は端末内の localStorage
            にのみ保存されます。次の場合にはデータが失われることがあります。
          </p>
          <ul className="mt-2 list-disc pl-5">
            <li>ブラウザの閲覧データ(サイトデータ)を消去したとき</li>
            <li>別の端末・別のブラウザで開いたとき(記録は引き継がれません)</li>
            <li>端末の故障・初期化・機種変更をしたとき</li>
          </ul>
          <p className="mt-2">
            自動削除の可能性を下げるため、本アプリは端末に対して「永続化ストレージ」の利用を要求します(
            <code>navigator.storage.persist()</code>
            )。それでも消失に備えて、
            <strong className="text-foreground">
              設定画面からのバックアップ(JSON書き出し)を定期的に行い、ご自身で保管してください
            </strong>
            。
          </p>
        </Section>

        <Section title="5. 外部への通信について">
          <p>本アプリは、健康データを外部へ送信しません。各機能の扱いは次のとおりです。</p>
          <ul className="mt-2 list-disc pl-5">
            <li>
              <strong className="text-foreground">
                バックアップ / CSV取り込み
              </strong>
              : すべて端末内で処理されます。ファイルの書き出し・読み込みはあなたの操作によるもので、外部へ送信しません
            </li>
            <li>
              <strong className="text-foreground">通院用まとめ</strong>
              : 記録から要約テキストを作り、あなたの端末のクリップボードにコピーするだけです。送信はしません
            </li>
          </ul>
          <p className="mt-2">
            現時点では、外部サービスへ健康データを送信する機能はありません。将来、気圧の自動記録など外部の気象データを取得する機能を追加する場合は、位置情報の許可をその都度お願いし、事前に本ポリシーを更新します。
          </p>
        </Section>

        <Section title="6. Cookie・ローカルストレージ">
          <p>
            本アプリはログイン機能を持たないため、Cookie
            は使用しません。記録の保存にブラウザのローカルストレージを使用します。ブラウザの設定でこれらを削除できますが、その場合は記録も消えます。
          </p>
        </Section>

        <Section title="7. あなたのデータの管理">
          <p>
            データはすべて端末内にあるため、
            <strong className="text-foreground">
              あなた自身が完全に管理できます
            </strong>
            。アプリ内で記録の編集・削除ができ、設定画面からバックアップの書き出し・復元ができます。運営者はあなたのデータにアクセスできません。共有端末では、他の人に記録を見られないようご注意ください。
          </p>
        </Section>

        <Section title="8. プライバシーポリシーの改定">
          <p>
            本ポリシーは必要に応じて改定することがあります。重要な変更がある場合は本アプリ内でお知らせします。変更後も引き続きご利用いただいた場合、改定後のポリシーに同意したものとみなします。
          </p>
        </Section>

        <Section title="9. お問い合わせ">
          <p>
            本ポリシーに関するご質問は下記までお問い合わせください。
            <br />
<ContactEmail />
          </p>
        </Section>

        <div className="border-border mt-2 border-t pt-5 text-center">
          <Link
            to="/"
            className="text-primary inline-block px-4 py-2.5 text-sm hover:underline"
          >
            ← トップに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
