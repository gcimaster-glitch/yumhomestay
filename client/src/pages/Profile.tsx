import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { User, Mail, Globe, ShieldCheck, ClipboardList, Home, ChevronRight, AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "es", label: "Español", flag: "🇪🇸" },
];

export default function Profile() {
  const { t } = useTranslation();
  const { user, isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();

  // フォーム状態（ユーザー情報が読み込まれたら初期化）
  const [name, setName] = useState("");
  const [preferredLang, setPreferredLang] = useState("en");

  // メールアドレス変更フロー
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  // ユーザー情報が取得できたら初期値をセット
  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setPreferredLang(user.preferredLanguage ?? "en");
    }
  }, [user?.id]);

  // 変更があるかどうかチェック（メールは別フローなので除外）
  const hasChanges =
    name !== (user?.name ?? "") ||
    preferredLang !== (user?.preferredLanguage ?? "en");

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: (data) => {
      // auth.meキャッシュを更新して他のコンポーネントに反映
      if (data.user) {
        utils.auth.me.setData(undefined, data.user as typeof user);
      }
      toast.success(t("profile.saved"));
    },
    onError: (err) => {
      toast.error(err.message || t("profile.saveFailed"));
    },
  });

  const requestEmailChange = trpc.user.requestEmailChange.useMutation({
    onSuccess: () => {
      setEmailSent(true);
      toast.success(t("profile.emailVerificationSent"));
    },
    onError: (err) => {
      toast.error(err.message || t("profile.emailChangeFailed"));
    },
  });

  const handleSave = () => {
    const input: { name?: string; preferredLanguage?: string } = {};
    if (name !== (user?.name ?? "")) input.name = name;
    if (preferredLang !== (user?.preferredLanguage ?? "en")) input.preferredLanguage = preferredLang;
    updateProfile.mutate(input);
  };

  const handleEmailChangeRequest = () => {
    if (!newEmail || newEmail === user?.email) return;
    requestEmailChange.mutate({
      newEmail,
      origin: window.location.origin,
    });
  };

  const handleEmailDialogClose = () => {
    setEmailDialogOpen(false);
    setNewEmail("");
    setEmailSent(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">{t("common.loginRequired")}</p>
            <a href={getLoginUrl()}>
              <Button>{t("nav.login")}</Button>
            </a>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />
      <div className="container py-8 max-w-2xl space-y-6">
        {/* ページヘッダー */}
        <div>
          <h1 className="text-2xl font-bold">{t("nav.profile")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("profile.subtitle")}</p>
        </div>

        {/* 基本情報カード */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              {t("profile.basicInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* 名前 */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                {t("profile.name")}
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("profile.namePlaceholder")}
                maxLength={100}
              />
            </div>

            {/* メールアドレス（読み取り専用 + 変更ボタン） */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                {t("profile.email")}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  value={user.email ?? ""}
                  readOnly
                  className="bg-muted/50 cursor-not-allowed flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewEmail("");
                    setEmailSent(false);
                    setEmailDialogOpen(true);
                  }}
                  className="shrink-0"
                >
                  <Mail className="w-3.5 h-3.5 mr-1.5" />
                  {t("profile.changeEmail")}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("profile.emailHint")}
              </p>
            </div>

            {/* 表示言語 */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                {t("profile.displayLanguage")}
              </Label>
              <Select value={preferredLang} onValueChange={setPreferredLang}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.flag} {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t("profile.languageHint")}
              </p>
            </div>

            <Separator />

            {/* 保存ボタン */}
            <div className="flex items-center justify-between">
              {hasChanges ? (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {t("profile.unsavedChanges")}
                </p>
              ) : (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t("profile.upToDate")}
                </p>
              )}
              <Button
                onClick={handleSave}
                disabled={!hasChanges || updateProfile.isPending}
                size="sm"
              >
                {updateProfile.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    {t("common.saving")}
                  </>
                ) : (
                  t("profile.saveChanges")
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* アカウント情報カード（読み取り専用） */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              {t("profile.accountInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("profile.accountType")}</span>
              <Badge variant="outline" className="capitalize">{user.role}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("profile.identityStatus")}</span>
              <Badge
                variant={user.identityStatus === "verified" ? "default" : "secondary"}
                className={user.identityStatus === "verified" ? "bg-green-100 text-green-700 border-green-200" : ""}
              >
                {user.identityStatus === "verified" ? `✓ ${t("profile.verified")}` : user.identityStatus ?? t("profile.unverified")}
              </Badge>
            </div>
            {user.identityStatus !== "verified" && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground bg-muted rounded-md p-3">
                  {t("profile.identityVerificationNote")}
                </p>
                {user.identityStatus === "pending" ? (
                  <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    審査中です。結果はメールでお知らせします。
                  </p>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                    onClick={() => window.location.href = '/kyc'}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                    本人確認書類を提出する
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* クイックリンクカード */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">{t("profile.myPage")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <Link href="/my-inquiries">
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <ClipboardList className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{t("profile.inquiryStatus")}</p>
                    <p className="text-xs text-muted-foreground">{t("profile.inquiryStatusDesc")}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Link>
            <Link href="/my/bookings">
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <Home className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{t("profile.bookingList")}</p>
                    <p className="text-xs text-muted-foreground">{t("profile.bookingListDesc")}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Link>
            {(user.userType === "host" || user.role === "admin") && (
              <Link href="/host/dashboard">
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{t("profile.hostDashboard")}</p>
                      <p className="text-xs text-muted-foreground">{t("profile.hostDashboardDesc")}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />

      {/* メールアドレス変更ダイアログ */}
      <Dialog open={emailDialogOpen} onOpenChange={(open) => { if (!open) handleEmailDialogClose(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              {t("profile.changeEmail")}
            </DialogTitle>
            <DialogDescription>
              {emailSent ? t("profile.emailVerificationSentDesc") : t("profile.changeEmailDesc")}
            </DialogDescription>
          </DialogHeader>

          {emailSent ? (
            <div className="py-4 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <Send className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-sm text-muted-foreground">
                {t("profile.emailVerificationSentTo", { email: newEmail })}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("profile.emailVerificationExpiry")}
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="current-email">{t("profile.currentEmail")}</Label>
                <Input id="current-email" value={user.email ?? ""} readOnly className="bg-muted/50" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-email">{t("profile.newEmail")}</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="new@example.com"
                  maxLength={320}
                  onKeyDown={(e) => { if (e.key === "Enter") handleEmailChangeRequest(); }}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleEmailDialogClose}>
              {emailSent ? t("common.close") : t("common.cancel")}
            </Button>
            {!emailSent && (
              <Button
                onClick={handleEmailChangeRequest}
                disabled={!newEmail || newEmail === user.email || requestEmailChange.isPending}
              >
                {requestEmailChange.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    {t("common.sending")}
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    {t("profile.sendVerificationEmail")}
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
