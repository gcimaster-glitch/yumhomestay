/**
 * Login Page (/login)
 * OAuth未設定時のフォールバックページ。
 * VITE_OAUTH_PORTAL_URL が設定されている場合はOAuthログインへリダイレクト、
 * 未設定の場合はデモログインへの誘導を表示する。
 */
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogIn, Users, ChefHat, Briefcase, ArrowRight, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Login() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { isAuthenticated, loading } = useAuth();

  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const isOAuthConfigured = oauthPortalUrl && oauthPortalUrl !== "undefined";

  // 既にログイン済みの場合はトップページへ
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, loading, navigate]);

  // OAuth設定済みの場合は自動的にOAuthページへリダイレクト
  useEffect(() => {
    if (isOAuthConfigured && !loading && !isAuthenticated) {
      const loginUrl = getLoginUrl();
      if (loginUrl !== "/login") {
        window.location.href = loginUrl;
      }
    }
  }, [isOAuthConfigured, loading, isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const demoAccounts = [
    {
      key: "host",
      label: t("demo.hostLabel", "ホストファミリー"),
      description: t("demo.hostDesc", "ホームステイ体験を提供するホストとして試す"),
      icon: Users,
      color: "border-amber-200 hover:border-amber-400",
      iconColor: "text-amber-600",
      badgeColor: "bg-amber-100 text-amber-700",
      redirectPath: "/host/dashboard",
    },
    {
      key: "cooking_school",
      label: t("demo.cookingLabel", "料理教室"),
      description: t("demo.cookingDesc", "料理教室オーナーとして管理機能を試す"),
      icon: ChefHat,
      color: "border-green-200 hover:border-green-400",
      iconColor: "text-green-600",
      badgeColor: "bg-green-100 text-green-700",
      redirectPath: "/cooking-school/dashboard",
    },
    {
      key: "agent",
      label: t("demo.agentLabel", "旅行代理店"),
      description: t("demo.agentDesc", "旅行代理店として予約管理機能を試す"),
      icon: Briefcase,
      color: "border-blue-200 hover:border-blue-400",
      iconColor: "text-blue-600",
      badgeColor: "bg-blue-100 text-blue-700",
      redirectPath: "/agent/dashboard",
    },
  ];

  const handleDemoLogin = async (key: string, redirectPath: string) => {
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
      navigate(redirectPath);
    } catch (err: unknown) {
      console.error("Demo login failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/20">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <span className="text-xl font-bold text-amber-700">YumHomeStay</span>
          </button>
          <Badge variant="outline" className="text-xs text-muted-foreground">
            {t("login.badge", "ログイン")}
          </Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-6">
            <LogIn className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-3">
            {t("login.title", "YumHomeStayにログイン")}
          </h1>
          <p className="text-slate-500 max-w-md mx-auto text-base">
            {t("login.subtitle", "日本のホームステイ・料理体験プラットフォーム")}
          </p>
        </div>

        {/* OAuth Login Button (設定済みの場合のみ表示) */}
        {isOAuthConfigured && (
          <div className="max-w-sm mx-auto mb-10">
            <Button
              className="w-full h-12 text-base gap-2"
              onClick={() => { window.location.href = getLoginUrl(); }}
            >
              <LogIn className="w-5 h-5" />
              {t("login.oauthButton", "アカウントでログイン")}
            </Button>
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-4 max-w-sm mx-auto mb-10">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {t("login.orTryDemo", "または デモで試す")}
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Demo Notice */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
          <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">{t("demo.noticeTitle", "デモ環境について")}</p>
            <p className="text-blue-600">
              {t("demo.noticeDesc", "デモアカウントではメール送信・決済機能は動作しません。実際のシステムをお試しいただけます。")}
            </p>
          </div>
        </div>

        {/* Demo Account Cards */}
        <div className="grid md:grid-cols-3 gap-5 max-w-3xl mx-auto">
          {demoAccounts.map((account) => {
            const Icon = account.icon;
            return (
              <Card
                key={account.key}
                className={`border-2 transition-all duration-200 cursor-pointer ${account.color}`}
                onClick={() => handleDemoLogin(account.key, account.redirectPath)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border">
                      <Icon className={`w-5 h-5 ${account.iconColor}`} />
                    </div>
                    <Badge className={`text-xs border-0 ${account.badgeColor}`}>
                      {account.label}
                    </Badge>
                  </div>
                  <CardTitle className="text-base text-slate-800">{account.label}デモ</CardTitle>
                  <CardDescription className="text-sm text-slate-500">
                    {account.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDemoLogin(account.key, account.redirectPath);
                    }}
                  >
                    {account.label}でログイン
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Back to Home */}
        <div className="mt-10 text-center">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {t("login.backToHome", "← トップページに戻る")}
          </button>
        </div>
      </main>
    </div>
  );
}
