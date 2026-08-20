import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ContactEmail } from "@/components/ContactEmail";

// 利用規約(/terms)。静的ページ。
// なおったメモ固有の重要免責: 医療・診断・治療の代替ではない。データは端末内のみ・消失リスクは自己責任。
export const Route = createFileRoute("/terms")({
  component: TermsPage,
});

const ESTABLISHED = "2026年8月20日";

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

function TermsPage() {
  return (
    <div className="bg-background flex min-h-dvh justify-center px-4 pt-10 pb-16">
      <div className="bg-card border-border w-full max-w-2xl rounded-2xl border p-6 shadow-sm sm:p-8">
        <div className="mb-7">
          <Link to="/" className="text-primary text-xs hover:underline">
            ← トップに戻る
          </Link>
          <h1 className="text-foreground mt-4 mb-1 font-serif text-2xl font-bold">
            利用規約
          </h1>
          <p className="text-muted-foreground m-0 text-xs">制定: {ESTABLISHED}</p>
        </div>

        <Section title="第1条(適用)">
          <p>
            本規約は、ピータン(以下「運営者」)が提供するサービス「なおったメモ」(以下「本アプリ」)の利用条件を定めるものです。ユーザーは、本アプリを利用することにより、本規約および
            <Link to="/privacy" className="text-primary hover:underline">
              プライバシーポリシー
            </Link>
            に同意したものとみなします。
          </p>
        </Section>

        <Section title="第2条(本アプリの性質・重要な免責)">
          <p>
            本アプリは、体調や症状の経過を自分で記録するための個人用の道具です。次の点に必ずご同意のうえご利用ください。
          </p>
          <ul className="mt-2 list-disc pl-5">
            <li>
              本アプリは
              <strong className="text-foreground">
                医療行為・診断・治療ではなく、医師その他の専門家による助言・診断・治療の代替にもなりません
              </strong>
              。健康や症状に関する判断は、必ず医療機関にご相談ください
            </li>
            <li>
              本アプリの記録・表示(経過日数、罹病スパン、通院用のまとめ等)は、あなたの入力にもとづく整理であり、
              <strong className="text-foreground">
                医学的な正確性を保証するものではありません
              </strong>
            </li>
            <li>
              生命・身体に危険が疑われる場合は、消防(119)・救急・かかりつけ医など、適切な窓口へ速やかにご連絡ください。本アプリはこれらの代替になりません
            </li>
          </ul>
        </Section>

        <Section title="第3条(データの保存とバックアップの責任)">
          <p>
            本アプリのデータは、
            <strong className="text-foreground">
              お使いの端末内にのみ保存され、運営者は保持しません
            </strong>
            (詳細は
            <Link to="/privacy" className="text-primary hover:underline">
              プライバシーポリシー
            </Link>
            )。
            <strong className="text-foreground">
              ブラウザのデータ消去・機種変更・端末の故障・不具合等により、記録が失われる可能性があり、運営者はこれを復元できません
            </strong>
            。データの保全のため、設定画面からのバックアップの書き出しと保管は、ユーザーご自身の責任で行ってください。
          </p>
        </Section>

        <Section title="第4条(禁止事項)">
          <p>ユーザーは、本アプリの利用にあたり、次の行為をしてはなりません。</p>
          <ul className="mt-2 list-disc pl-5">
            <li>法令または公序良俗に違反する行為</li>
            <li>本アプリの複製・改変・リバースエンジニアリング等(法令で認められる範囲を除く)</li>
            <li>本アプリの提供・運営を妨害する行為</li>
            <li>その他、運営者が不適切と判断する行為</li>
          </ul>
        </Section>

        <Section title="第5条(知的財産・ユーザーの記録)">
          <p>
            本アプリおよびその表示・プログラム等に関する権利は運営者または正当な権利者に帰属します。一方、
            <strong className="text-foreground">
              ユーザーが記録した内容(健康記録)はユーザーに帰属し、端末内にのみ存在します
            </strong>
            。運営者はこれにアクセスできず、利用することもありません。
          </p>
        </Section>

        <Section title="第6条(サービスの変更・終了)">
          <p>
            運営者は、事前の予告なく本アプリの内容の変更・機能の追加や廃止・提供の中断や終了を行うことができます。本アプリが終了しても、端末内に保存されたデータおよび書き出し済みのバックアップは、ユーザーの端末側に残ります。
          </p>
        </Section>

        <Section title="第7条(料金)">
          <p>
            本アプリは現在無料で提供しています。将来、有料の機能を導入する場合は、内容と条件を別途定め、事前に告知します。
          </p>
        </Section>

        <Section title="第8条(免責)">
          <p>
            本アプリは現状有姿で提供され、運営者はその完全性・正確性・有用性・特定目的への適合性を保証しません。
          </p>
          <p className="mt-2">
            運営者は、本アプリの利用または利用不能、データの消失、不具合、記録・表示の誤り等によりユーザーまたは第三者に生じた損害について、運営者に故意または重大な過失がある場合を除き、責任を負いません。
          </p>
        </Section>

        <Section title="第9条(規約の改定)">
          <p>
            運営者は、必要に応じて本規約を改定することがあります。改定する場合は、本アプリ内で周知します。周知後に本アプリを利用した場合、改定後の規約に同意したものとみなします。
          </p>
        </Section>

        <Section title="第10条(準拠法・管轄)">
          <p>
            本規約の準拠法は日本法とします。本アプリに関して紛争が生じた場合、運営者の所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。
          </p>
        </Section>

        <Section title="お問い合わせ">
          <p>
            本規約に関するご質問は下記までお問い合わせください。
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
