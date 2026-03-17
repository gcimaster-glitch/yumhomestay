/**
 * DemoCookingSchool.tsx — 料理教室専用デモログインページ
 * URL: /demo/cooking-school
 * 料理教室以外の情報は一切表示しない
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChefHat, ArrowRight, Info, Loader2, CheckCircle, ArrowLeft } from "lucide-react";

const FEATURES = [
  "料理教室ダッシュボード（収益・予約管理）",
  "体験プログラム管理（作成・編集・公開）",
  "予約・受講者管理",
  "収益レポート・シミュレーター",
  "カレンダー管理（空き日程設定）",
];

export default function DemoCookingSchool() {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/demo/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "cooking_school" }),
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "ログインに失敗しました" }));
        throw new Error(err.error || "ログインに失敗しました");
      }

      setDone(true);
      toast.success("デモアカウントでログインしました");
      setTimeout(() => navigate("/cooking-school/dashboard"), 800);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "ログインに失敗しました";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate("/for-cooking-schools")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            料理教室向け資料に戻る
          </button>
          <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
            料理教室デモ環境
          </Badge>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-16">
        {/* Title */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ChefHat className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-3">
            料理教室向けデモ
          </h1>
          <p className="text-slate-600">
            実際の料理教室管理ダッシュボードをそのまま体験できます。
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
        <Card className="border-2 border-orange-200 bg-orange-50 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
                <ChefHat className="w-6 h-6 text-orange-600" />
              </div>
              <Badge className="text-xs bg-orange-100 text-orange-700 border-0">料理教室</Badge>
            </div>
            <CardTitle className="text-xl text-slate-800">料理教室ダッシュボードを体験</CardTitle>
            <CardDescription className="text-slate-600">
              料理教室オーナーとして、体験プログラムの管理・
              予約状況・収益レポートをご体験いただけます。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ul className="space-y-2">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                  <CheckCircle className="w-4 h-4 text-orange-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-6 text-base font-semibold"
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
                  料理教室デモを開始する
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Back link */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate("/for-cooking-schools")}
            className="text-sm text-orange-600 hover:underline"
          >
            資料請求・詳細はこちら
          </button>
        </div>
      </main>
    </div>
  );
}
