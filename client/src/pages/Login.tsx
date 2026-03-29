/**
 * Login Page (/login)
 * Google・LINE・メール/パスワードによる独自認証ログインページ。
 * タブ切り替えで「ログイン」「新規登録」「パスワードリセット」を提供する。
 */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  LogIn, Users, ChefHat, Briefcase, ArrowRight, Info,
  Mail, Lock, User, Eye, EyeOff, CheckCircle, AlertCircle
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

// ─── Google・LINEアイコン（SVG）────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function LineIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" fill="#06C755"/>
    </svg>
  );
}

export default function Login() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading } = useAuth();

  // タブ状態
  const [activeTab, setActiveTab] = useState<"login" | "register" | "reset">("login");

  // フォーム状態
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  // UI状態
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [socialLoading, setSocialLoading] = useState<"google" | "line" | null>(null);

  // tRPC mutations
  const loginMutation = trpc.auth.loginWithEmail.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: (err) => {
      setErrorMsg(err.message);
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      setSuccessMsg(data.message);
      setErrorMsg("");
    },
    onError: (err) => {
      setErrorMsg(err.message);
    },
  });

  const resetMutation = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: (data) => {
      setSuccessMsg(data.message);
      setErrorMsg("");
    },
    onError: (err) => {
      setErrorMsg(err.message);
    },
  });

  // 既にログイン済みの場合はトップページへ
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, loading, navigate]);

  // URLエラーパラメータ処理
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    if (error) {
      const errorMessages: Record<string, string> = {
        google_auth_failed: "Googleログインに失敗しました",
        google_token_failed: "Googleトークンの取得に失敗しました",
        line_auth_failed: "LINEログインに失敗しました",
        line_token_failed: "LINEトークンの取得に失敗しました",
        token_expired: "確認リンクの有効期限が切れています。再度登録してください",
        verification_failed: "メール確認に失敗しました",
      };
      setErrorMsg(errorMessages[error] || "ログインに失敗しました");
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ─── ソーシャルログイン ────────────────────────────────────────────────────────
  const handleSocialLogin = async (provider: "google" | "line") => {
    setSocialLoading(provider);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/auth/${provider}/url`);
      const data = await res.json() as { available: boolean; url: string | null };
      if (data.available && data.url) {
        window.location.href = data.url;
      } else {
        setErrorMsg(`${provider === "google" ? "Google" : "LINE"}ログインは現在設定中です。メールアドレスでログインしてください。`);
        setSocialLoading(null);
      }
    } catch {
      setErrorMsg("ログインURLの取得に失敗しました");
      setSocialLoading(null);
    }
  };

  // ─── メールログイン ────────────────────────────────────────────────────────────
  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!email || !password) {
      setErrorMsg("メールアドレスとパスワードを入力してください");
      return;
    }
    loginMutation.mutate({ email, password });
  };

  // ─── 新規登録 ─────────────────────────────────────────────────────────────────
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!name || !email || !password || !confirmPassword) {
      setErrorMsg("すべての項目を入力してください");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("パスワードが一致しません");
      return;
    }
    if (password.length < 8) {
      setErrorMsg("パスワードは8文字以上で設定してください");
      return;
    }
    if (!termsAgreed) {
      setErrorMsg("利用規約への同意が必要です");
      return;
    }
    registerMutation.mutate({ name, email, password, termsAgreed });
  };

  // ─── パスワードリセット ────────────────────────────────────────────────────────
  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!resetEmail) {
      setErrorMsg("メールアドレスを入力してください");
      return;
    }
    resetMutation.mutate({ email: resetEmail });
  };

  // ─── デモログイン ─────────────────────────────────────────────────────────────
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

  const demoAccounts = [
    {
      key: "host",
      label: "ホストファミリー",
      description: "ホームステイ体験を提供するホストとして試す",
      icon: Users,
      color: "border-amber-200 hover:border-amber-400",
      iconColor: "text-amber-600",
      redirectPath: "/host/dashboard",
    },
    {
      key: "cooking_school",
      label: "料理教室",
      description: "料理教室オーナーとして管理機能を試す",
      icon: ChefHat,
      color: "border-green-200 hover:border-green-400",
      iconColor: "text-green-600",
      redirectPath: "/cooking-school/dashboard",
    },
    {
      key: "agent",
      label: "旅行代理店",
      description: "旅行代理店として予約管理機能を試す",
      icon: Briefcase,
      color: "border-blue-200 hover:border-blue-400",
      iconColor: "text-blue-600",
      redirectPath: "/agent/dashboard",
    },
  ];

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
            ログイン / 新規登録
          </Badge>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 mb-4">
            <LogIn className="w-7 h-7 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">YumHomeStayへようこそ</h1>
          <p className="text-slate-500 text-sm">日本のホームステイ・料理体験プラットフォーム</p>
        </div>

        {/* エラー・成功メッセージ */}
        {errorMsg && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}
        {successMsg && activeTab !== "register" && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{successMsg}</AlertDescription>
          </Alert>
        )}

        {/* メインカード */}
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
          <CardContent className="pt-6">
            {/* ソーシャルログインボタン */}
            <div className="space-y-3 mb-6">
              <Button
                variant="outline"
                className="w-full h-11 gap-3 text-sm font-medium border-slate-200 hover:bg-slate-50"
                onClick={() => handleSocialLogin("google")}
                disabled={socialLoading !== null}
              >
                {socialLoading === "google" ? (
                  <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                Googleでログイン / 登録
              </Button>
              <Button
                variant="outline"
                className="w-full h-11 gap-3 text-sm font-medium border-green-200 hover:bg-green-50 text-green-700"
                onClick={() => handleSocialLogin("line")}
                disabled={socialLoading !== null}
              >
                {socialLoading === "line" ? (
                  <div className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LineIcon />
                )}
                LINEでログイン / 登録
              </Button>
            </div>

            {/* 区切り線 */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">またはメールアドレスで</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* タブ：ログイン / 新規登録 */}
            {activeTab !== "reset" && (
              <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as "login" | "register"); setErrorMsg(""); setSuccessMsg(""); }}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="login">ログイン</TabsTrigger>
                  <TabsTrigger value="register">新規登録</TabsTrigger>
                </TabsList>

                {/* ─── ログインタブ ─────────────────────────────────────────────── */}
                <TabsContent value="login">
                  <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="login-email">メールアドレス</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="example@email.com"
                          className="pl-9"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          autoComplete="email"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="login-password">パスワード</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="パスワードを入力"
                          className="pl-9 pr-10"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-11"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <LogIn className="w-4 h-4 mr-2" />
                          ログイン
                        </>
                      )}
                    </Button>
                    <button
                      type="button"
                      className="w-full text-xs text-muted-foreground hover:text-primary transition-colors text-center"
                      onClick={() => { setActiveTab("reset"); setErrorMsg(""); setSuccessMsg(""); }}
                    >
                      パスワードを忘れた方はこちら
                    </button>
                  </form>
                </TabsContent>

                {/* ─── 新規登録タブ ─────────────────────────────────────────────── */}
                <TabsContent value="register">
                  {successMsg ? (
                    <div className="text-center py-4">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                      <p className="text-sm font-medium text-slate-700 mb-1">確認メールを送信しました</p>
                      <p className="text-sm text-slate-600">{successMsg}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        メールが届かない場合は迷惑メールフォルダをご確認ください
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="reg-name">お名前</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="reg-name"
                            type="text"
                            placeholder="山田 太郎"
                            className="pl-9"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoComplete="name"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="reg-email">メールアドレス</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="reg-email"
                            type="email"
                            placeholder="example@email.com"
                            className="pl-9"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="reg-password">パスワード（8文字以上）</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="reg-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="8文字以上のパスワード"
                            className="pl-9 pr-10"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="reg-confirm">パスワード（確認）</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="reg-confirm"
                            type={showPassword ? "text" : "password"}
                            placeholder="パスワードを再入力"
                            className="pl-9"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            autoComplete="new-password"
                          />
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id="terms"
                          checked={termsAgreed}
                          onCheckedChange={(v) => setTermsAgreed(v === true)}
                          className="mt-0.5"
                        />
                        <label htmlFor="terms" className="text-xs text-slate-600 leading-relaxed cursor-pointer">
                          <a href="/terms" target="_blank" className="text-primary hover:underline">利用規約</a>
                          および
                          <a href="/privacy" target="_blank" className="text-primary hover:underline">プライバシーポリシー</a>
                          に同意します
                        </label>
                      </div>
                      <Button
                        type="submit"
                        className="w-full h-11"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          "確認メールを送信する"
                        )}
                      </Button>
                    </form>
                  )}
                </TabsContent>
              </Tabs>
            )}

            {/* パスワードリセット */}
            {activeTab === "reset" && (
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-4">パスワードをリセット</h3>
                {successMsg ? (
                  <div className="text-center py-4">
                    <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">{successMsg}</p>
                  </div>
                ) : (
                  <form onSubmit={handlePasswordReset} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="reset-email">登録済みのメールアドレス</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="example@email.com"
                          className="pl-9"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-11" disabled={resetMutation.isPending}>
                      {resetMutation.isPending ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        "リセットメールを送信"
                      )}
                    </Button>
                  </form>
                )}
                <button
                  type="button"
                  className="w-full text-xs text-muted-foreground hover:text-primary transition-colors text-center mt-3"
                  onClick={() => { setActiveTab("login"); setErrorMsg(""); setSuccessMsg(""); }}
                >
                  ← ログインに戻る
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* デモアカウント */}
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">デモで試す</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-600">
              デモアカウントではメール送信・決済機能は動作しません。システムの操作感をお試しいただけます。
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {demoAccounts.map((account) => {
              const Icon = account.icon;
              return (
                <Card
                  key={account.key}
                  className={`border-2 transition-all duration-200 cursor-pointer ${account.color}`}
                  onClick={() => handleDemoLogin(account.key, account.redirectPath)}
                >
                  <CardContent className="p-3 text-center">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border mx-auto mb-2">
                      <Icon className={`w-4 h-4 ${account.iconColor}`} />
                    </div>
                    <p className="text-xs font-medium text-slate-700 leading-tight">{account.label}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 h-7 text-xs gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDemoLogin(account.key, account.redirectPath);
                      }}
                    >
                      試す <ArrowRight className="w-3 h-3" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* トップページへ */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            ← トップページに戻る
          </button>
        </div>
      </main>
    </div>
  );
}
