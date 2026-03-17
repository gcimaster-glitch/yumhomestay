/**
 * PartnerFormWizard.tsx
 * 2カラムのステップ式フォームウィザード共通コンポーネント
 * 左: ナビゲーターガイド（イラスト・ステップ一覧）
 * 右: フォームコンテンツ（プログレスバー付き）
 */
import { cn } from "@/lib/utils";
import { CheckCircle } from "lucide-react";

export interface WizardStep {
  id: number;
  title: string;
  desc?: string;
  icon?: React.ReactNode;
}

interface NavigatorMessage {
  step: number;
  message: string;
}

interface PartnerFormWizardProps {
  /** 現在のステップ番号 (1始まり) */
  currentStep: number;
  /** ステップ定義 */
  steps: WizardStep[];
  /** ナビゲーターのステップ別メッセージ */
  navigatorMessages: NavigatorMessage[];
  /** ナビゲーターのカラーテーマ */
  theme?: "green" | "orange" | "blue";
  /** ナビゲーターのタイトル */
  navigatorTitle?: string;
  /** フォームコンテンツ */
  children: React.ReactNode;
}

const THEME_COLORS = {
  green: {
    bg: "from-emerald-600 to-green-700",
    accent: "bg-emerald-500",
    stepActive: "bg-white text-emerald-700",
    stepDone: "bg-emerald-400 text-white",
    stepPending: "bg-emerald-800/40 text-emerald-200",
    stepLine: "bg-emerald-400",
    stepLinePending: "bg-emerald-800/40",
    bubble: "bg-emerald-50 border-emerald-200 text-emerald-800",
    progressBar: "bg-emerald-600",
  },
  orange: {
    bg: "from-orange-500 to-amber-600",
    accent: "bg-orange-400",
    stepActive: "bg-white text-orange-600",
    stepDone: "bg-orange-300 text-white",
    stepPending: "bg-orange-800/40 text-orange-200",
    stepLine: "bg-orange-300",
    stepLinePending: "bg-orange-800/40",
    bubble: "bg-orange-50 border-orange-200 text-orange-800",
    progressBar: "bg-orange-500",
  },
  blue: {
    bg: "from-blue-600 to-indigo-700",
    accent: "bg-blue-500",
    stepActive: "bg-white text-blue-700",
    stepDone: "bg-blue-400 text-white",
    stepPending: "bg-blue-800/40 text-blue-200",
    stepLine: "bg-blue-400",
    stepLinePending: "bg-blue-800/40",
    bubble: "bg-blue-50 border-blue-200 text-blue-800",
    progressBar: "bg-blue-600",
  },
};

export function PartnerFormWizard({
  currentStep,
  steps,
  navigatorMessages,
  theme = "green",
  navigatorTitle = "ナビゲーター",
  children,
}: PartnerFormWizardProps) {
  const colors = THEME_COLORS[theme];
  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;
  const currentMsg =
    navigatorMessages.find((m) => m.step === currentStep)?.message ??
    navigatorMessages[0]?.message ??
    "";

  return (
    <div className="flex flex-col lg:flex-row min-h-0 gap-0">
      {/* ── 左カラム: ナビゲーターガイド ── */}
      <div
        className={cn(
          "lg:w-80 xl:w-96 flex-shrink-0 bg-gradient-to-b text-white flex flex-col gap-4",
          "p-4 lg:p-8",
          colors.bg
        )}
      >
        {/* ナビゲーターイラスト＋吹き出し */}
        <div className="flex flex-col items-center gap-3">
          {/* キャラクターイラスト（モバイルでは小さく表示） */}
          <div className="relative hidden sm:block">
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center shadow-lg">
              <NavigatorCharacter theme={theme} />
            </div>
            {/* オンライン表示 */}
            <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
          </div>
          {/* モバイル用コンパクトキャラクター */}
          <div className="sm:hidden flex items-center gap-3 w-full">
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shadow">
                <NavigatorCharacter theme={theme} />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
            </div>
            <p className="text-sm font-semibold opacity-90">{navigatorTitle}</p>
          </div>
          <p className="text-sm font-semibold opacity-90 hidden sm:block">{navigatorTitle}</p>

          {/* 吹き出し */}
          <div className="relative w-full">
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl rounded-tl-sm p-3 sm:p-4 text-sm leading-relaxed">
              {currentMsg}
            </div>
          </div>
        </div>

        {/* ステップ一覧（モバイルでは非表示） */}
        <div className="hidden lg:flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-2">
            ステップ
          </p>
          {steps.map((s, i) => {
            const isDone = currentStep > s.id;
            const isActive = currentStep === s.id;
            return (
              <div key={s.id} className="flex items-start gap-3">
                {/* ステップ番号 + 縦線 */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all",
                      isDone
                        ? colors.stepDone
                        : isActive
                          ? colors.stepActive
                          : colors.stepPending
                    )}
                  >
                    {isDone ? <CheckCircle className="w-4 h-4" /> : s.id}
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={cn(
                        "w-0.5 h-6 mt-1 transition-all",
                        isDone ? colors.stepLine : colors.stepLinePending
                      )}
                    />
                  )}
                </div>
                {/* ステップテキスト */}
                <div className="pb-4">
                  <p
                    className={cn(
                      "text-sm font-medium leading-tight",
                      isActive ? "opacity-100" : isDone ? "opacity-80" : "opacity-50"
                    )}
                  >
                    {s.title}
                  </p>
                  {s.desc && (
                    <p
                      className={cn(
                        "text-xs mt-0.5 leading-snug",
                        isActive ? "opacity-70" : "opacity-40"
                      )}
                    >
                      {s.desc}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 右カラム: フォームコンテンツ ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* プログレスバー */}
        <div className="h-1.5 bg-muted w-full">
          <div
            className={cn("h-full transition-all duration-500", colors.progressBar)}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* ステップ表示 */}
        <div className="px-6 pt-5 pb-2 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                ステップ {currentStep} / {steps.length}
              </p>
              <h2 className="text-lg font-bold text-foreground mt-0.5">
                {steps[currentStep - 1]?.title}
              </h2>
              {steps[currentStep - 1]?.desc && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {steps[currentStep - 1].desc}
                </p>
              )}
            </div>
            {/* ドット式ステップインジケーター */}
            <div className="flex gap-1.5 flex-shrink-0">
              {steps.map((s) => (
                <div
                  key={s.id}
                  className={cn(
                    "rounded-full transition-all",
                    currentStep === s.id
                      ? cn("w-6 h-2.5", colors.progressBar)
                      : currentStep > s.id
                        ? cn("w-2.5 h-2.5", colors.progressBar, "opacity-60")
                        : "w-2.5 h-2.5 bg-muted"
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* フォーム本体 */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

/** ナビゲーターキャラクターSVG */
function NavigatorCharacter({ theme }: { theme: "green" | "orange" | "blue" }) {
  const faceColor =
    theme === "green" ? "#10b981" : theme === "orange" ? "#f97316" : "#3b82f6";
  return (
    <svg viewBox="0 0 80 80" className="w-16 h-16" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 体 */}
      <ellipse cx="40" cy="58" rx="18" ry="14" fill="white" fillOpacity="0.9" />
      {/* 頭 */}
      <circle cx="40" cy="32" r="18" fill="white" fillOpacity="0.95" />
      {/* 顔パーツ */}
      <circle cx="34" cy="30" r="2.5" fill={faceColor} />
      <circle cx="46" cy="30" r="2.5" fill={faceColor} />
      {/* 笑顔 */}
      <path d="M33 38 Q40 44 47 38" stroke={faceColor} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* 頬 */}
      <circle cx="30" cy="35" r="3" fill={faceColor} fillOpacity="0.2" />
      <circle cx="50" cy="35" r="3" fill={faceColor} fillOpacity="0.2" />
    </svg>
  );
}
