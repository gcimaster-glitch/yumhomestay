/**
 * PartnerThanks.tsx — 資料請求完了サンクスページ
 * URL: /thanks/partner?type=host|cooking_school|agent&name=xxx
 * 資料請求フォーム送信後にリダイレクトされる専用ページ
 */
import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  ArrowRight,
  Play,
  Mail,
  Calendar,
  FileText,
  Home,
  ChefHat,
  Briefcase,
  Clock,
  Users,
  Star,
} from "lucide-react";

type PartnerType = "host" | "cooking_school" | "agent";

interface PartnerConfig {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  demoPath: string;
  demoLabel: string;
  businessPath: string;
  businessLabel: string;
  nextSteps: { icon: React.ReactNode; title: string; desc: string }[];
  message: string;
}

const PARTNER_CONFIG: Record<PartnerType, PartnerConfig> = {
  host: {
    label: "ホストファミリー",
    icon: <Home className="w-8 h-8 text-green-600" />,
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    demoPath: "/demo/host",
    demoLabel: "ホストデモを今すぐ体験→",
    businessPath: "/business/host",
    businessLabel: "ホストの収益モデルを詳しく見る",
    message:
      "ご自宅でゲストをお迎えし、一緒に料理を作る体験を提供するホストファミリーとして、ぜひご参加ください。",
    nextSteps: [
      {
        icon: <Mail className="w-5 h-5 text-green-600" />,
        title: "確認メールをご確認ください",
        desc: "ご登録のメールアドレスに資料と確認メールをお送りしました。",
      },
      {
        icon: <Clock className="w-5 h-5 text-green-600" />,
        title: "3営業日以内にご連絡します",
        desc: "担当者より詳細のご説明と、登録手続きのご案内をいたします。",
      },
      {
        icon: <Calendar className="w-5 h-5 text-green-600" />,
        title: "デモで操作感を確認",
        desc: "実際のホストダッシュボードをデモ環境でお試しいただけます。",
      },
    ],
  },
  cooking_school: {
    label: "料理教室",
    icon: <ChefHat className="w-8 h-8 text-orange-600" />,
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    demoPath: "/demo/cooking-school",
    demoLabel: "料理教室デモを今すぐ体験→",
    businessPath: "/business/cooking-school",
    businessLabel: "料理教室の収益モデルを詳しく見る",
    message:
      "海外からの受講者に日本料理の魅力を伝え、国際的な知名度を高める料理教室パートナーとしてご参加ください。",
    nextSteps: [
      {
        icon: <Mail className="w-5 h-5 text-orange-600" />,
        title: "確認メールをご確認ください",
        desc: "ご登録のメールアドレスに資料と確認メールをお送りしました。",
      },
      {
        icon: <Clock className="w-5 h-5 text-orange-600" />,
        title: "3営業日以内にご連絡します",
        desc: "担当者より詳細のご説明と、掲載手続きのご案内をいたします。",
      },
      {
        icon: <Users className="w-5 h-5 text-orange-600" />,
        title: "デモで操作感を確認",
        desc: "実際の料理教室ダッシュボードをデモ環境でお試しいただけます。",
      },
    ],
  },
  agent: {
    label: "旅行代理店",
    icon: <Briefcase className="w-8 h-8 text-blue-600" />,
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    demoPath: "/demo/agent",
    demoLabel: "代理店デモを今すぐ体験→",
    businessPath: "/business/agent",
    businessLabel: "代理店の収益モデルを詳しく見る",
    message:
      "旅行者に特別な日本体験を提供し、差別化された旅行商品を展開する代理店パートナーとしてご参加ください。",
    nextSteps: [
      {
        icon: <Mail className="w-5 h-5 text-blue-600" />,
        title: "確認メールをご確認ください",
        desc: "ご登録のメールアドレスに資料と確認メールをお送りしました。",
      },
      {
        icon: <Clock className="w-5 h-5 text-blue-600" />,
        title: "3営業日以内にご連絡します",
        desc: "担当者より詳細のご説明と、代理店契約のご案内をいたします。",
      },
      {
        icon: <Star className="w-5 h-5 text-blue-600" />,
        title: "デモで操作感を確認",
        desc: "実際の代理店ダッシュボードをデモ環境でお試しいただけます。",
      },
    ],
  },
};

export default function PartnerThanks() {
  const [, navigate] = useLocation();

  // URLパラメータからtype・nameを取得
  const params = new URLSearchParams(window.location.search);
  const rawType = params.get("type") ?? "host";
  const name = params.get("name") ?? "";
  const type: PartnerType =
    rawType === "cooking_school" || rawType === "agent" ? rawType : "host";

  const config = PARTNER_CONFIG[type];

  // ページトップにスクロール
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/">
            <span className="flex items-center gap-2 font-bold text-lg text-foreground hover:opacity-80 transition-opacity">
              <span className="text-2xl">🍱</span>
              YumHomeStay
            </span>
          </Link>
          <Badge
            variant="outline"
            className={`text-xs ${config.bgColor} ${config.color} ${config.borderColor}`}
          >
            {config.label}パートナー申請
          </Badge>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-16">
        {/* Success Icon */}
        <div className="text-center mb-10">
          <div
            className={`w-24 h-24 ${config.bgColor} rounded-full flex items-center justify-center mx-auto mb-6 shadow-md`}
          >
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-3">
            {name ? `${name} 様、` : ""}ありがとうございます！
          </h1>
          <p className="text-slate-600 text-lg leading-relaxed max-w-xl mx-auto">
            資料請求を受け付けました。
            {config.message}
          </p>
        </div>

        {/* Next Steps */}
        <div className={`rounded-2xl border ${config.borderColor} ${config.bgColor} p-8 mb-8`}>
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            今後の流れ
          </h2>
          <div className="space-y-5">
            {config.nextSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-slate-500">{i + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {step.icon}
                    <span className="font-semibold text-slate-800">{step.title}</span>
                  </div>
                  <p className="text-sm text-slate-600">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Demo CTA */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-8 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-2">
            ご連絡をお待ちの間に
          </h2>
          <p className="text-slate-600 mb-6">
            実際の管理画面をデモ環境でご体験いただけます。
            登録・クレジットカード不要でお試しいただけます。
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              className="flex-1 py-6 text-base font-semibold gap-2"
              onClick={() => navigate(config.demoPath)}
            >
              <Play className="w-5 h-5" />
              {config.demoLabel}
            </Button>
            <Link href={config.businessPath} className="flex-1">
              <Button variant="outline" className="w-full py-6 text-base gap-2">
                <FileText className="w-5 h-5" />
                {config.businessLabel}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer links */}
        <div className="text-center space-y-3">
          <p className="text-sm text-slate-500">
            ご不明な点は{" "}
            <Link href="/contact" className="text-primary hover:underline">
              お問い合わせ
            </Link>{" "}
            よりご連絡ください。
          </p>
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 underline block">
            トップページへ戻る
          </Link>
        </div>
      </main>
    </div>
  );
}
