/**
 * Password Reset Page (/reset-password?token=xxx)
 * メールで受け取ったトークンを使って新しいパスワードを設定するページ。
 */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function ResetPassword() {
  const [, navigate] = useLocation();

  // URLからトークンを取得
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const resetMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: (data) => {
      setSuccessMsg(data.message);
      setErrorMsg("");
      // 3秒後にログインページへ
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    },
    onError: (err) => {
      setErrorMsg(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!password || !confirmPassword) {
      setErrorMsg("すべての項目を入力してください");
      return;
    }
    if (password.length < 8) {
      setErrorMsg("パスワードは8文字以上で設定してください");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("パスワードが一致しません");
      return;
    }
    if (!token) {
      setErrorMsg("無効なリセットリンクです。パスワードリセットを再度お試しください");
      return;
    }

    resetMutation.mutate({ token, newPassword: password });
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/20 flex items-center justify-center px-4">
        <Card className="max-w-md w-full shadow-lg border-0 bg-white/90">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-7 h-7 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 mb-2">無効なリンクです</h1>
            <p className="text-sm text-slate-500 mb-6">
              このリンクは無効または期限切れです。<br />
              パスワードリセットを再度お試しください。
            </p>
            <Button className="w-full" onClick={() => navigate("/login")}>
              ログインページへ戻る
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/20 flex items-center justify-center px-4">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <button
            onClick={() => navigate("/")}
            className="text-xl font-bold text-amber-700 hover:opacity-80 transition-opacity"
          >
            YumHomeStay
          </button>
        </div>
      </div>

      <Card className="max-w-md w-full shadow-lg border-0 bg-white/90 backdrop-blur-sm mt-16">
        <CardContent className="pt-8 pb-8">
          {successMsg ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-800 mb-2">パスワードを変更しました</h1>
              <p className="text-sm text-slate-500 mb-2">{successMsg}</p>
              <p className="text-xs text-muted-foreground">3秒後にログインページへ移動します...</p>
              <Button className="w-full mt-6" onClick={() => navigate("/login")}>
                今すぐログインページへ
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-7 h-7 text-amber-600" />
                </div>
                <h1 className="text-xl font-bold text-slate-800 mb-1">新しいパスワードを設定</h1>
                <p className="text-sm text-slate-500">8文字以上のパスワードを入力してください</p>
              </div>

              {errorMsg && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errorMsg}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="new-password">新しいパスワード</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="new-password"
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
                  <Label htmlFor="confirm-password">パスワード（確認）</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="パスワードを再入力"
                      className="pl-9"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                {/* パスワード強度インジケーター */}
                {password.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            password.length >= level * 3
                              ? level <= 1 ? "bg-red-400"
                              : level <= 2 ? "bg-yellow-400"
                              : level <= 3 ? "bg-blue-400"
                              : "bg-green-400"
                              : "bg-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {password.length < 8 ? "8文字以上が必要です" :
                       password.length < 12 ? "普通の強度" :
                       password.length < 16 ? "強いパスワード" : "非常に強いパスワード"}
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={resetMutation.isPending}
                >
                  {resetMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "パスワードを変更する"
                  )}
                </Button>

                <button
                  type="button"
                  className="w-full text-xs text-muted-foreground hover:text-primary transition-colors text-center"
                  onClick={() => navigate("/login")}
                >
                  ← ログインページへ戻る
                </button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
