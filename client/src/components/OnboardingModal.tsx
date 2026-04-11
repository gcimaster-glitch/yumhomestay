/**
 * OnboardingModal.tsx — 初回ログイン後のウェルカムオンボーディングモーダル
 *
 * CMO指摘事項:
 * - 新規ユーザーが利用規約同意後、次のアクションが不明確
 * - 「何をすればいいか」が伝わらず離脱率が高い
 *
 * 解決策:
 * - 利用規約同意完了後に1回だけ表示（localStorage で管理）
 * - ユーザータイプ（ゲスト/ホスト希望）を選択させ、適切なページへ誘導
 * - 3ステップの進捗バーで「今どこにいるか」を可視化
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Home, UtensilsCrossed, ArrowRight, X } from "lucide-react";

const ONBOARDING_KEY = "yhs_onboarding_shown_v1";

interface OnboardingModalProps {
  userName?: string | null;
  onClose: () => void;
}

export default function OnboardingModal({ userName, onClose }: OnboardingModalProps) {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const handleClose = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    onClose();
  };

  const handleGoExperiences = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    onClose();
    navigate("/experiences");
  };

  const handleGoHostRegister = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    onClose();
    navigate("/host/register");
  };

  const handleGoApply = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    onClose();
    navigate("/apply");
  };

  return (
    <div className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-lg border border-border overflow-hidden">

        {/* ─── 進捗バー ─────────────────────────────────────────────── */}
        <div className="px-6 pt-6 pb-0">
          <div className="flex items-center gap-2 mb-6">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className="flex items-center flex-1">
                <div
                  className={`h-2 w-full rounded-full transition-all duration-300 ${
                    i + 1 <= step ? "bg-primary" : "bg-muted"
                  }`}
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-right -mt-4 mb-4">
            {step} / {totalSteps}
          </p>
        </div>

        {/* ─── ステップ 1: ようこそ ──────────────────────────────────── */}
        {step === 1 && (
          <div className="px-6 pb-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {t("onboarding.welcomeTitle", { name: userName || t("onboarding.guest") })}
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t("onboarding.welcomeDesc")}
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 text-primary-foreground text-sm font-bold">1</div>
                <div>
                  <p className="font-medium text-sm">{t("onboarding.step1Title")}</p>
                  <p className="text-xs text-muted-foreground">{t("onboarding.step1Desc")}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center shrink-0 text-primary text-sm font-bold">2</div>
                <div>
                  <p className="font-medium text-sm">{t("onboarding.step2Title")}</p>
                  <p className="text-xs text-muted-foreground">{t("onboarding.step2Desc")}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center shrink-0 text-primary text-sm font-bold">3</div>
                <div>
                  <p className="font-medium text-sm">{t("onboarding.step3Title")}</p>
                  <p className="text-xs text-muted-foreground">{t("onboarding.step3Desc")}</p>
                </div>
              </div>
            </div>

            <Button className="w-full" onClick={() => setStep(2)}>
              {t("onboarding.next")} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* ─── ステップ 2: 目的を選択 ───────────────────────────────── */}
        {step === 2 && (
          <div className="px-6 pb-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-foreground mb-2">
                {t("onboarding.purposeTitle")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("onboarding.purposeDesc")}
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {/* ゲストとして体験を探す */}
              <button
                onClick={handleGoExperiences}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center shrink-0 group-hover:bg-orange-200 transition-colors">
                  <UtensilsCrossed className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{t("onboarding.asGuest")}</p>
                  <p className="text-xs text-muted-foreground">{t("onboarding.asGuestDesc")}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>

              {/* 申請フォームから体験を申し込む */}
              <button
                onClick={handleGoApply}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 group-hover:bg-blue-200 transition-colors">
                  <ArrowRight className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{t("onboarding.asApplicant")}</p>
                  <p className="text-xs text-muted-foreground">{t("onboarding.asApplicantDesc")}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>

              {/* ホストとして登録する */}
              <button
                onClick={handleGoHostRegister}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0 group-hover:bg-green-200 transition-colors">
                  <Home className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{t("onboarding.asHost")}</p>
                  <p className="text-xs text-muted-foreground">{t("onboarding.asHostDesc")}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            </div>

            <button
              onClick={() => setStep(1)}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← {t("onboarding.back")}
            </button>
          </div>
        )}

        {/* ─── ステップ 3: 完了（スキップ時） ─────────────────────── */}
        {step === 3 && (
          <div className="px-6 pb-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              {t("onboarding.readyTitle")}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {t("onboarding.readyDesc")}
            </p>
            <Button className="w-full" onClick={handleClose}>
              {t("onboarding.startExploring")}
            </Button>
          </div>
        )}

        {/* ─── スキップボタン ────────────────────────────────────────── */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted/80 flex items-center justify-center hover:bg-muted transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

/**
 * オンボーディングモーダルの表示判定フック
 * - localStorage に表示済みフラグがなければ表示
 */
export function useOnboarding() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const shown = localStorage.getItem(ONBOARDING_KEY);
    if (!shown) {
      // 少し遅延させてTermsAgreementModalの後に表示
      const timer = setTimeout(() => setShow(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  return {
    show,
    dismiss: () => {
      localStorage.setItem(ONBOARDING_KEY, "true");
      setShow(false);
    },
  };
}
