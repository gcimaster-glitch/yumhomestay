/**
 * KycSubmit.tsx
 * 本人確認（eKYC）ページ
 *
 * 優先: Stripe Identity（ブラウザ内フロー）
 * フォールバック: 手動書類アップロード
 */
import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
// @stripe/stripe-js は eKYC フロー開始時のみ動的インポート（TBT削減）
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  CheckCircle,
  ShieldCheck,
  Upload,
  Loader2,
  ExternalLink,
  FileImage,
} from "lucide-react";
import { toast } from "sonner";

// ── Stripe.js ──────────────────────────────────────────────────────────────
// loadStripe は eKYC フロー開始時に動的インポートして遅延ロードする
// （トップページ等でのバンドル読み込みを防ぎ TBT を削減）
let stripePromise: ReturnType<typeof import("@stripe/stripe-js")["loadStripe"]> | null = null;

async function getStripe() {
  if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) return null;
  if (!stripePromise) {
    // pureバージョンを使用して自動スクリプト注入を回避
    // (通常の@stripe/stripe-jsはモジュール読み込み時にjs.stripe.comを自動注入する)
    const { loadStripe } = await import("@stripe/stripe-js/pure");
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string);
  }
  return stripePromise;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ── 画像アップロードボックス ────────────────────────────────────────────────
function ImageUploadBox({
  label,
  required,
  value,
  onChange,
}: {
  label: string;
  required?: boolean;
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error("ファイルサイズは10MB以下にしてください");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          value
            ? "border-green-300 bg-green-50"
            : "border-border hover:border-amber-300 hover:bg-amber-50/30"
        }`}
        onClick={() => inputRef.current?.click()}
      >
        {value ? (
          <div className="space-y-2">
            <img
              src={value}
              alt="preview"
              className="max-h-32 mx-auto rounded object-contain"
            />
            <p className="text-xs text-green-600 font-medium flex items-center justify-center gap-1">
              <CheckCircle className="w-3 h-3" /> アップロード済み
            </p>
          </div>
        ) : (
          <div className="py-4 space-y-2">
            <FileImage className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">クリックして画像を選択</p>
            <p className="text-xs text-muted-foreground">JPG・PNG・HEIC（10MB以下）</p>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {value && (
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-destructive underline"
          onClick={(e) => {
            e.stopPropagation();
            onChange(null);
          }}
        >
          削除する
        </button>
      )}
    </div>
  );
}

// ── メインコンポーネント ────────────────────────────────────────────────────
export default function KycSubmit() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  // Stripe Identity 状態
  const [stripeLoading, setStripeLoading] = useState(false);

  // 手動提出フォーム状態
  const [showManual, setShowManual] = useState(false);
  const [documentType, setDocumentType] = useState<
    "passport" | "drivers_license" | "residence_card"
  >("passport");
  const [frontBase64, setFrontBase64] = useState<string | null>(null);
  const [backBase64, setBackBase64] = useState<string | null>(null);
  const [selfieBase64, setSelfieBase64] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // tRPC mutations
  const createVerificationSession = trpc.kyc.createVerificationSession.useMutation();
  const submitKyc = trpc.kyc.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      utils.auth.me.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "提出に失敗しました。再度お試しください。");
    },
  });

  // ── Stripe Identity フロー ────────────────────────────────────────────────
  const handleStripeIdentity = useCallback(async () => {
    setStripeLoading(true);
    try {
      // Stripe JS を eKYC 開始時に初めて動的ロード（トップページでの読み込みを回避）
      const stripe = await getStripe();
      if (!stripe) {
        toast.error("Stripe が設定されていません。手動提出をご利用ください。");
        setShowManual(true);
        setStripeLoading(false);
        return;
      }
      const returnUrl = `${window.location.origin}/kyc?verified=1`;
      const { clientSecret } = await createVerificationSession.mutateAsync({ returnUrl });
      if (!clientSecret) {
        throw new Error("client_secret が取得できませんでした");
      }

      // Stripe Identity の確認フローを開く
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (stripe as any).verifyIdentity(clientSecret);
      if (error) {
        if (error.code === "session_canceled") {
          toast.info("本人確認をキャンセルしました");
        } else {
          toast.error(`エラー: ${error.message}`);
        }
      } else {
        toast.success("本人確認書類を送信しました。審査結果をお待ちください。");
        await utils.auth.me.invalidate();
        navigate("/profile");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "エラーが発生しました";
      console.error("[KYC] Stripe Identity error:", err);
      toast.error(`${msg} — 手動提出をお試しください。`);
      setShowManual(true);
    } finally {
      setStripeLoading(false);
    }
  }, [createVerificationSession, utils, navigate]);

  // ── 手動提出 ──────────────────────────────────────────────────────────────
  const handleManualSubmit = () => {
    if (!frontBase64) {
      toast.error("書類の表面画像は必須です");
      return;
    }
    submitKyc.mutate({
      documentType,
      documentFrontBase64: frontBase64,
      documentBackBase64: backBase64 ?? undefined,
      selfieBase64: selfieBase64 ?? undefined,
    });
  };

  // ── 認証チェック ──────────────────────────────────────────────────────────
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
            <p className="text-muted-foreground">ログインが必要です</p>
            <a href={getLoginUrl()}>
              <Button>ログイン</Button>
            </a>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (user.identityStatus === "verified") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 max-w-sm">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">本人確認済みです</h2>
            <p className="text-muted-foreground text-sm">
              お客様の本人確認は完了しています。
            </p>
            <Button variant="outline" onClick={() => navigate("/profile")}>
              プロフィールに戻る
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (submitted || user.identityStatus === "pending") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 max-w-sm">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold">書類を受け付けました</h2>
            <p className="text-muted-foreground text-sm">
              審査には通常1〜3営業日かかります。結果はメールでお知らせします。
            </p>
            <Button variant="outline" onClick={() => navigate("/profile")}>
              プロフィールに戻る
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />
      <div className="container max-w-2xl py-10 space-y-6">
        {/* ヘッダー */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            <Badge variant="secondary">本人確認（eKYC）</Badge>
          </div>
          <h1 className="text-2xl font-bold">本人確認</h1>
          <p className="text-muted-foreground text-sm mt-1">
            ご予約やホスト登録には本人確認が必要です。
          </p>
        </div>

        {/* Stripe Identity（推奨） */}
        {!showManual && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                Stripe Identity で本人確認（推奨）
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Stripe の安全な本人確認フローを使用します。パスポート・運転免許証・IDカードに対応しています。
                スマートフォンのカメラで書類と自撮りを撮影するだけで完了します。
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 space-y-1">
                <p className="font-medium">確認に必要なもの</p>
                <ul className="text-xs space-y-0.5 list-disc list-inside text-blue-700">
                  <li>有効なパスポート・運転免許証・IDカードのいずれか</li>
                  <li>カメラ付きデバイス（スマートフォン推奨）</li>
                  <li>所要時間：約2〜3分</li>
                </ul>
              </div>
              <Button
                className="w-full"
                onClick={handleStripeIdentity}
                disabled={stripeLoading || createVerificationSession.isPending}
              >
                {stripeLoading || createVerificationSession.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    準備中...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Stripe Identity で本人確認を開始
                  </>
                )}
              </Button>
              <button
                type="button"
                className="w-full text-xs text-muted-foreground underline hover:text-foreground"
                onClick={() => setShowManual(true)}
              >
                Stripe Identity が使えない場合は手動提出へ
              </button>
            </CardContent>
          </Card>
        )}

        {/* 手動書類提出（フォールバック） */}
        {showManual && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">書類の手動アップロード</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <button
                type="button"
                className="text-xs text-muted-foreground underline hover:text-foreground"
                onClick={() => setShowManual(false)}
              >
                ← Stripe Identity に戻る
              </button>
              <div className="space-y-1.5">
                <Label>
                  書類の種類 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={documentType}
                  onValueChange={(v) =>
                    setDocumentType(v as typeof documentType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passport">パスポート</SelectItem>
                    <SelectItem value="drivers_license">運転免許証</SelectItem>
                    <SelectItem value="residence_card">在留カード</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <ImageUploadBox
                label="書類の表面"
                required
                value={frontBase64}
                onChange={setFrontBase64}
              />
              {documentType !== "passport" && (
                <ImageUploadBox
                  label="書類の裏面"
                  value={backBase64}
                  onChange={setBackBase64}
                />
              )}
              <ImageUploadBox
                label="自撮り写真（任意）"
                value={selfieBase64}
                onChange={setSelfieBase64}
              />
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 space-y-1">
                <p className="font-medium">提出前のご確認</p>
                <ul className="text-xs space-y-0.5 list-disc list-inside text-amber-700">
                  <li>書類全体が鮮明に写っていること</li>
                  <li>有効期限内の書類であること</li>
                  <li>氏名・生年月日・顔写真が確認できること</li>
                </ul>
              </div>
              <Button
                className="w-full"
                onClick={handleManualSubmit}
                disabled={!frontBase64 || submitKyc.isPending}
              >
                {submitKyc.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    アップロード中...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    書類を提出する
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
}
