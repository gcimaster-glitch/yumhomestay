/**
 * DemoAgent.tsx — 旅行代理店専用デモログインページ
 * URL: /demo/agent
 * 旅行代理店以外の情報は一切表示しない
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, ArrowRight, Info, Loader2, CheckCircle, ArrowLeft } from "lucide-react";

const FEATURES = [
  "代理店ダッシュボード（送客実績・収益管理）",
  "ゲスト予約代行（一括・個別）",
  "手数料・収益レポート",
  "体験プログラム一覧・空き確認",
  "専用問い合わせ・サポート窓口",
];

export default function DemoAgent() {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/demo/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "agent" }),
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "ログインに失敗しました" }));
        throw new Error(err.error || "ログインに失敗しました");
      }

      setDone(true);
      toast.success("デモアカウントでログインしました");
      setTimeout(() => navigate("/agent/dashboard"), 800);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "ログインに失敗しました";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate("/for-agents")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            旅行代理店向け資料に戻る
          </button>
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            代理店デモ環境
          </Badge>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-16">
        {/* Title */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-3">
            旅行代理店向けデモ
          </h1>
          <p className="text-slate-600">
            実際の代理店管理ダッシュボードをそのまま体験できます。
            登録・クレジットカード不要でお試しいただけます。
          </p>
        </div>

        {/* Notice */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
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

        {/* Demo Card */}
        <Card className="border-2 border-blue-200 bg-blue-50 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              <Badge className="text-xs bg-blue-100 text-blue-700 border-0">旅行代理店</Badge>
            </div>
            <CardTitle className="text-xl text-slate-800">代理店ダッシュボードを体験</CardTitle>
            <CardDescription className="text-slate-600">
              旅行代理店として、ゲスト送客・予約管理・
              収益管理をご体験いただけます。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ul className="space-y-2">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                  <CheckCircle className="w-4 h-4 text-blue-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-base font-semibold"
              onClick={handleDemoLogin}
              disabled={loading || done}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ログイン中...
                </>
              ) : done ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  ダッシュボードへ移動中...
                </>
              ) : (
                <>
                  代理店デモを開始する
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Back link */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate("/for-agents")}
            className="text-sm text-blue-600 hover:underline"
          >
            資料請求・詳細はこちら
          </button>
        </div>
      </main>
    </div>
  );
}
