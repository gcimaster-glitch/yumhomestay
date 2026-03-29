/**
 * 利用規約同意モーダル
 * - 初回ログイン時（termsAgreedAt が null のユーザー）に表示
 * - 同意日時をDBに記録（法的証拠）
 * - キャンセル不可（同意しないとサービスを利用できない）
 */
import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, FileText, AlertCircle } from "lucide-react";

const TERMS_VERSION = "1.0";

interface TermsAgreementModalProps {
  onAgreed: () => void;
}

export default function TermsAgreementModal({ onAgreed }: TermsAgreementModalProps) {
  const { t } = useTranslation();
  const [agreed, setAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  const agreeToTermsMutation = trpc.auth.agreeToTerms.useMutation({
    onSuccess: () => {
      onAgreed();
    },
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 50;
    if (atBottom) setScrolledToBottom(true);
  };

  const handleAgree = () => {
    if (!agreed || !privacyAgreed) return;
    agreeToTermsMutation.mutate({ version: TERMS_VERSION });
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 pt-8 overflow-y-auto">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-2xl border border-border">
        {/* ヘッダー */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {t("terms.modalTitle") || "YumHomeStay 利用規約への同意"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("terms.modalSubtitle") || "サービスをご利用いただく前に、以下の規約をお読みください"}
            </p>
          </div>
        </div>

        {/* 規約本文 */}
        <div className="px-6 py-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">利用規約（バージョン {TERMS_VERSION}）</span>
          </div>
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="h-64 rounded-lg border border-border bg-muted/30 p-4 text-sm text-foreground/80 leading-relaxed overflow-y-auto"
          >
            <div className="space-y-4">
              <section>
                <h3 className="font-semibold text-foreground mb-2">第1条（適用）</h3>
                <p>本規約は、YumHomeStay（以下「当社」）が提供するホームステイ体験マッチングサービス（以下「本サービス」）の利用に関する条件を定めるものです。ユーザーは本規約に同意した上で本サービスを利用するものとします。</p>
              </section>
              <section>
                <h3 className="font-semibold text-foreground mb-2">第2条（料金・決済）</h3>
                <p>本サービスの利用料金は、各体験プログラムのページに表示された金額とします。決済はStripeを通じて行われ、予約確定後の返金は一切お受けできません。クレジットやプランの申し込みは返金100%不可能です。</p>
              </section>
              <section>
                <h3 className="font-semibold text-foreground mb-2">第3条（免責事項）</h3>
                <p>当社の責任は、お支払いいただいた金額を超える賠償を受けられません。ホストとゲスト間のトラブル、配信先とのトラブルについても当社は免責とします。</p>
              </section>
              <section>
                <h3 className="font-semibold text-foreground mb-2">第4条（禁止事項）</h3>
                <p>ユーザーは以下の行為を行ってはなりません：（1）法令または公序良俗に違反する行為、（2）当社または第三者の知的財産権を侵害する行為、（3）本サービスの運営を妨害する行為、（4）不正アクセスその他の不正行為。</p>
              </section>
              <section>
                <h3 className="font-semibold text-foreground mb-2">第5条（個人情報の取り扱い）</h3>
                <p>当社は、ユーザーの個人情報をプライバシーポリシーに従い適切に管理します。ユーザーの個人情報は、本サービスの提供・改善および法令に基づく場合を除き、第三者に提供しません。</p>
              </section>
              <section>
                <h3 className="font-semibold text-foreground mb-2">第6条（規約の変更）</h3>
                <p>当社は、必要に応じて本規約を変更することができます。変更後の規約は、当社ウェブサイトに掲載した時点から効力を生じるものとします。</p>
              </section>
              <section>
                <h3 className="font-semibold text-foreground mb-2">第7条（準拠法・管轄）</h3>
                <p>本規約の解釈にあたっては、日本法を準拠法とします。本サービスに関して紛争が生じた場合には、東京地方裁判所を第一審の専属的合意管轄裁判所とします。</p>
              </section>
              <p className="text-xs text-muted-foreground pt-2">制定日：2025年1月1日　最終改定日：2025年3月1日</p>
            </div>
          </div>

          {!scrolledToBottom && (
            <div className="flex items-center gap-2 mt-2 text-xs text-amber-600">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>規約を最後までスクロールしてご確認ください</span>
            </div>
          )}
        </div>

        {/* 同意チェックボックス */}
        <div className="px-6 pb-4 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer group">
            <Checkbox
              checked={agreed}
              onCheckedChange={(v) => setAgreed(Boolean(v))}
              className="mt-0.5"
              disabled={!scrolledToBottom}
            />
            <span className={`text-sm leading-relaxed ${!scrolledToBottom ? "text-muted-foreground" : "text-foreground"}`}>
              <span className="font-medium">利用規約</span>を読み、内容に同意します
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer group">
            <Checkbox
              checked={privacyAgreed}
              onCheckedChange={(v) => setPrivacyAgreed(Boolean(v))}
              className="mt-0.5"
              disabled={!scrolledToBottom}
            />
            <span className={`text-sm leading-relaxed ${!scrolledToBottom ? "text-muted-foreground" : "text-foreground"}`}>
              <span className="font-medium">プライバシーポリシー</span>を読み、個人情報の取り扱いに同意します
            </span>
          </label>
        </div>

        {/* フッター */}
        <div className="px-6 py-4 border-t border-border bg-muted/30 rounded-b-2xl">
          <Button
            className="w-full"
            size="lg"
            onClick={handleAgree}
            disabled={!agreed || !privacyAgreed || agreeToTermsMutation.isPending}
          >
            {agreeToTermsMutation.isPending ? "処理中..." : "同意してサービスを開始する"}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            同意日時は法的証拠として記録されます（{TERMS_VERSION}版）
          </p>
        </div>
      </div>
    </div>
  );
}
