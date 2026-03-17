import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, ChefHat, Briefcase, ArrowRight, Info, Loader2 } from "lucide-react";

const DEMO_ACCOUNTS = [
  {
    key: "host",
    label: "ホストファミリー",
    description: "ご自宅でゲストをお迎えするホストファミリーとしてのダッシュボードを体験できます。",
    icon: Home,
    color: "bg-amber-50 border-amber-200",
    iconColor: "text-amber-600",
    badgeColor: "bg-amber-100 text-amber-700",
    features: [
      "ホストダッシュボード（収益・予約管理）",
      "カレンダー管理（空き日程設定）",
      "予約一覧・ゲスト情報確認",
      "プロフィール編集",
    ],
    redirectPath: "/host/dashboard",
  },
  {
    key: "cooking_school",
    label: "料理教室",
    description: "料理教室オーナーとして、体験プログラムの管理・予約状況を確認できます。",
    icon: ChefHat,
    color: "bg-green-50 border-green-200",
    iconColor: "text-green-600",
    badgeColor: "bg-green-100 text-green-700",
    features: [
      "料理教室ダッシュボード",
      "体験プログラム管理",
      "予約・受講者管理",
      "収益レポート",
    ],
    redirectPath: "/cooking-school/dashboard",
  },
  {
    key: "agent",
    label: "旅行代理店",
    description: "旅行代理店として、ゲスト送客・予約管理・コミッション確認ができます。",
    icon: Briefcase,
    color: "bg-blue-50 border-blue-200",
    iconColor: "text-blue-600",
    badgeColor: "bg-blue-100 text-blue-700",
    features: [
      "代理店ダッシュボード",
      "ゲスト予約代行",
      "コミッション・収益管理",
      "体験プログラム一覧",
    ],
    redirectPath: "/agent/dashboard",
  },
];

export default function DemoLogin() {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState<string | null>(null);

  const handleDemoLogin = async (key: string, redirectPath: string) => {
    setLoading(key);
    try {
      const res = await fetch("/api/demo/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "ログインに失敗しました" }));
        throw new Error(err.error || "ログインに失敗しました");
      }

      toast.success("デモアカウントでログインしました");
      navigate(redirectPath);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "ログインに失敗しました";
      toast.error(message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-xl font-bold text-amber-700">YumHomeStay</span>
          </button>
          <Badge variant="outline" className="text-xs">デモ環境</Badge>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-800 mb-3">デモアカウントでお試し</h1>
          <p className="text-slate-600 max-w-xl mx-auto">
            実際のシステムをお試しいただけます。デモ環境ではメール送信・決済は動作しません。
          </p>
        </div>

        {/* Notice */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
          <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">デモ環境について</p>
            <ul className="space-y-0.5 text-blue-600">
              <li>・メール送信機能は動作しません（モック表示のみ）</li>
              <li>・Stripe決済は動作しません（テストモード表示のみ）</li>
              <li>・データは実際のサービスとは分離されています</li>
            </ul>
          </div>
        </div>

        {/* Demo Account Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {DEMO_ACCOUNTS.map((account) => {
            const Icon = account.icon;
            const isLoading = loading === account.key;
            return (
              <Card key={account.key} className={`border-2 ${account.color} hover:shadow-md transition-shadow`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm`}>
                      <Icon className={`w-5 h-5 ${account.iconColor}`} />
                    </div>
                    <Badge className={`text-xs ${account.badgeColor} border-0`}>{account.label}</Badge>
                  </div>
                  <CardTitle className="text-lg text-slate-800">{account.label}デモ</CardTitle>
                  <CardDescription className="text-sm text-slate-600">{account.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-1.5">
                    {account.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                        <span className={`w-1.5 h-1.5 rounded-full ${account.iconColor.replace("text-", "bg-")}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    onClick={() => handleDemoLogin(account.key, account.redirectPath)}
                    disabled={!!loading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ログイン中...
                      </>
                    ) : (
                      <>
                        {account.label}でログイン
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Back to LP links */}
        <div className="mt-10 text-center space-y-2">
          <p className="text-sm text-slate-500">詳細はこちら</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <button onClick={() => navigate("/for-hosts")} className="text-amber-600 hover:underline">ホストファミリー向け資料</button>
            <button onClick={() => navigate("/for-cooking-schools")} className="text-green-600 hover:underline">料理教室向け資料</button>
            <button onClick={() => navigate("/for-agents")} className="text-blue-600 hover:underline">旅行代理店向け資料</button>
          </div>
        </div>
      </main>
    </div>
  );
}
