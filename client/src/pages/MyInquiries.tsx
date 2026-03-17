/**
 * MyInquiries.tsx — ゲストの申込状況確認ページ（多言語対応）
 * プログレスバー・ステータス別詳細カード・キャンセル機能付き
 */
import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingChat } from "@/components/BookingChat";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  ClipboardList,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  CreditCard,
  Users,
  MapPin,
  Calendar,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Home,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";

type InquiryStatus =
  | "submitted" | "reviewing" | "host_contacted"
  | "confirmed" | "payment_sent" | "payment_received"
  | "completed" | "rejected" | "cancelled";

/** フロー上のステップ定義（ラベルはt()で動的に取得） */
const FLOW_STEP_KEYS = [
  { key: "submitted",        shortKey: "myInquiries.stepShort.submitted" },
  { key: "reviewing",        shortKey: "myInquiries.stepShort.reviewing" },
  { key: "host_contacted",   shortKey: "myInquiries.stepShort.host_contacted" },
  { key: "confirmed",        shortKey: "myInquiries.stepShort.confirmed" },
  { key: "payment_sent",     shortKey: "myInquiries.stepShort.payment_sent" },
  { key: "payment_received", shortKey: "myInquiries.stepShort.payment_received" },
  { key: "completed",        shortKey: "myInquiries.stepShort.completed" },
] as const;

/** フロー上の現在ステップインデックス（0〜6） */
function getStepIndex(status: InquiryStatus): number {
  const idx = FLOW_STEP_KEYS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

/** プログレスバーのパーセント（0〜100） */
function getProgressPercent(status: InquiryStatus): number {
  if (status === "rejected" || status === "cancelled") return 0;
  const idx = getStepIndex(status);
  return Math.round((idx / (FLOW_STEP_KEYS.length - 1)) * 100);
}

function ProgressStepper({ status }: { status: InquiryStatus }) {
  const { t } = useTranslation();
  if (status === "rejected" || status === "cancelled") return null;
  const currentIdx = getStepIndex(status);

  return (
    <div className="mt-4 mb-2">
      {/* 横型プログレスバー（デスクトップ） */}
      <div className="hidden sm:block">
        <div className="relative h-1.5 bg-muted rounded-full overflow-hidden mb-3">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${getProgressPercent(status)}%` }}
          />
        </div>
        <div className="flex justify-between">
          {FLOW_STEP_KEYS.map((step, i) => {
            const isDone = i < currentIdx;
            const isCurrent = i === currentIdx;
            return (
              <div key={step.key} className="flex flex-col items-center gap-1" style={{ minWidth: 0 }}>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-colors
                    ${isDone ? "bg-primary border-primary text-primary-foreground" :
                      isCurrent ? "bg-primary/20 border-primary text-primary" :
                      "bg-muted border-muted-foreground/30 text-muted-foreground"}`}
                >
                  {isDone ? "✓" : i + 1}
                </div>
                <span
                  className={`text-[10px] text-center leading-tight
                    ${isCurrent ? "text-primary font-semibold" : isDone ? "text-primary/70" : "text-muted-foreground"}`}
                  style={{ maxWidth: 48 }}
                >
                  {t(step.shortKey)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 縦型タイムライン（モバイル） */}
      <div className="sm:hidden">
        <div className="relative pl-6">
          {/* 縦線 */}
          <div className="absolute left-2.5 top-3 bottom-3 w-0.5 bg-muted" />
          {FLOW_STEP_KEYS.map((step, i) => {
            const isDone = i < currentIdx;
            const isCurrent = i === currentIdx;
            const isFuture = i > currentIdx;
            return (
              <div key={step.key} className="relative flex items-center gap-3 mb-2 last:mb-0">
                {/* ドット */}
                <div
                  className={`absolute -left-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border-2 z-10 transition-colors
                    ${isDone ? "bg-primary border-primary text-primary-foreground" :
                      isCurrent ? "bg-primary/20 border-primary text-primary" :
                      "bg-background border-muted-foreground/30 text-muted-foreground"}`}
                >
                  {isDone ? "✓" : i + 1}
                </div>
                {/* ラベル */}
                <span
                  className={`text-xs pl-6 py-0.5
                    ${isCurrent ? "text-primary font-semibold" :
                      isDone ? "text-primary/70" :
                      isFuture ? "text-muted-foreground/50" : "text-muted-foreground"}`}
                >
                  {t(step.shortKey)}
                  {isCurrent && (
                    <span className="ml-1.5 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                      {t("myInquiries.currentStep")}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function InquiryCard({ inquiry, onCancel, onOpenChat }: {
  inquiry: {
    id: number;
    status: string;
    adultsCount: number;
    childrenCount: number;
    infantsCount: number;
    preferredArea?: string | null;
    preferredDateFrom?: string | null;
    preferredDateTo?: string | null;
    originCountry?: string | null;
    dietaryRestrictions?: string | null;
    specialRequests?: string | null;
    paymentLinkUrl?: string | null;
    rejectionReason?: string | null;
    submittedAt: Date;
    confirmedAt?: Date | null;
    assignedHostId?: number | null;
    videoCallScheduledAt?: Date | null;
    videoCallMeetingUrl?: string | null;
    videoCallNotes?: string | null;
  };
  onCancel: (id: number) => void;
  onOpenChat: (id: number) => void;
}) {
  const { t, i18n } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const status = inquiry.status as InquiryStatus;
  const canCancel = ["submitted", "reviewing", "host_contacted"].includes(status);

  const statusColorMap: Record<InquiryStatus, { color: string; bgColor: string; borderColor: string }> = {
    submitted:        { color: "text-blue-700",   bgColor: "bg-blue-50",   borderColor: "border-blue-200" },
    reviewing:        { color: "text-amber-700",  bgColor: "bg-amber-50",  borderColor: "border-amber-200" },
    host_contacted:   { color: "text-purple-700", bgColor: "bg-purple-50", borderColor: "border-purple-200" },
    confirmed:        { color: "text-green-700",  bgColor: "bg-green-50",  borderColor: "border-green-200" },
    payment_sent:     { color: "text-orange-700", bgColor: "bg-orange-50", borderColor: "border-orange-200" },
    payment_received: { color: "text-teal-700",   bgColor: "bg-teal-50",   borderColor: "border-teal-200" },
    completed:        { color: "text-gray-700",   bgColor: "bg-gray-50",   borderColor: "border-gray-200" },
    rejected:         { color: "text-red-700",    bgColor: "bg-red-50",    borderColor: "border-red-200" },
    cancelled:        { color: "text-gray-500",   bgColor: "bg-gray-50",   borderColor: "border-gray-200" },
  };

  const iconMap: Record<InquiryStatus, React.ReactNode> = {
    submitted:        <Clock className="w-4 h-4" />,
    reviewing:        <Clock className="w-4 h-4" />,
    host_contacted:   <Clock className="w-4 h-4" />,
    confirmed:        <CheckCircle2 className="w-4 h-4" />,
    payment_sent:     <CreditCard className="w-4 h-4" />,
    payment_received: <CheckCircle2 className="w-4 h-4" />,
    completed:        <CheckCircle2 className="w-4 h-4" />,
    rejected:         <XCircle className="w-4 h-4" />,
    cancelled:        <XCircle className="w-4 h-4" />,
  };

  const colors = statusColorMap[status] ?? statusColorMap.submitted;
  const icon = iconMap[status] ?? <Clock className="w-4 h-4" />;
  const locale = i18n.language.startsWith("ja") ? "ja-JP" : i18n.language.startsWith("zh") ? "zh-CN" : i18n.language.startsWith("ko") ? "ko-KR" : "en-US";

  return (
    <Card className={`overflow-hidden border-l-4 ${colors.borderColor}`}>
      <CardContent className="pt-5 pb-5">
        {/* ヘッダー行 */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{t("myInquiries.inquiryNo", { id: inquiry.id })}</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colors.bgColor} ${colors.color} ${colors.borderColor}`}>
              {icon}
              {t(`myInquiries.status.${status}`)}
            </span>
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {new Date(inquiry.submittedAt).toLocaleDateString(locale)}
          </span>
        </div>

        {/* プログレスステッパー */}
        <ProgressStepper status={status} />

        {/* ステータス説明 */}
        <div className={`mt-3 p-3 rounded-lg ${colors.bgColor} ${colors.borderColor} border`}>
          <p className={`text-sm font-medium ${colors.color}`}>{t(`myInquiries.desc.${status}`)}</p>
          {!["completed", "rejected", "cancelled"].includes(status) && (
            <p className="text-xs text-muted-foreground mt-1">
              → {t(`myInquiries.nextAction.${status}`)}
            </p>
          )}
        </div>

        {/* 申込内容サマリー */}
        <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {t("apply.adults")} {inquiry.adultsCount}
            {inquiry.childrenCount > 0 ? ` / ${t("apply.children")} ${inquiry.childrenCount}` : ""}
            {inquiry.infantsCount > 0 ? ` / ${t("apply.infants")} ${inquiry.infantsCount}` : ""}
          </span>
          {inquiry.preferredArea && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {inquiry.preferredArea}
            </span>
          )}
          {inquiry.preferredDateFrom && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {inquiry.preferredDateFrom}
              {inquiry.preferredDateTo ? ` ~ ${inquiry.preferredDateTo}` : ""}
            </span>
          )}
        </div>

        {/* 確定時: ホスト情報カード */}
        {(status === "confirmed" || status === "payment_sent" || status === "payment_received" || status === "completed") && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl relative overflow-hidden">
            {/* キャラクター */}
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/FWh8vTLvqLGbaqKezVTx6W/pose01_mama_f72ad8db.webp"
              alt="Mama Cook"
              className="absolute right-1 bottom-0 h-20 opacity-80 pointer-events-none select-none"
            />
            <div className="flex items-center gap-2 mb-2">
              <Home className="w-4 h-4 text-green-700" />
              <span className="text-sm font-semibold text-green-800">{t("myInquiries.matchConfirmed")}</span>
            </div>
            <p className="text-sm text-green-700 pr-16">
              {t("myInquiries.matchConfirmedDesc")}
            </p>
            {inquiry.confirmedAt && (
              <p className="text-xs text-green-600 mt-1">
                {t("myInquiries.confirmedAt")}: {new Date(inquiry.confirmedAt).toLocaleString(locale)}
              </p>
            )}
            {inquiry.videoCallScheduledAt && (
              <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-purple-800">📹 {t("myInquiries.videoCallTitle")}</span>
                </div>
                <p className="text-sm text-purple-700">
                  {t("myInquiries.videoCallDate")}: {new Date(inquiry.videoCallScheduledAt).toLocaleString(locale, { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
                {inquiry.videoCallMeetingUrl && (
                  <a
                    href={inquiry.videoCallMeetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1 text-sm text-purple-700 underline hover:text-purple-900"
                  >
                    {t("myInquiries.joinMeeting")} ↗
                  </a>
                )}
                {inquiry.videoCallNotes && (
                  <p className="text-xs text-purple-600 mt-1">{inquiry.videoCallNotes}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* お支払いボタン */}
        {status === "payment_sent" && inquiry.paymentLinkUrl && (
          <div className="mt-3">
            <Button size="sm" asChild className="w-full sm:w-auto">
              <a href={inquiry.paymentLinkUrl} target="_blank" rel="noopener noreferrer">
                <CreditCard className="w-4 h-4 mr-2" />
                {t("myInquiries.goToPayment")}
              </a>
            </Button>
          </div>
        )}

        {/* 却下理由 */}
        {status === "rejected" && inquiry.rejectionReason && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertCircle className="w-3.5 h-3.5 text-red-600" />
              <span className="text-xs font-semibold text-red-700">{t("myInquiries.rejectionReason")}</span>
            </div>
            <p className="text-sm text-red-700">{inquiry.rejectionReason}</p>
            <div className="mt-2">
              <Button size="sm" variant="outline" asChild className="text-xs">
                <Link href="/apply">{t("myInquiries.reapply")}</Link>
              </Button>
            </div>
          </div>
        )}

        {/* 詳細展開パネル */}
        <button
          className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? t("myInquiries.hideDetails") : t("myInquiries.showDetails")}
        </button>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-border space-y-2 text-sm">
            {inquiry.originCountry && (
              <div className="flex gap-2">
                <span className="text-muted-foreground w-24 shrink-0">{t("apply.originCountry")}</span>
                <span>{inquiry.originCountry}</span>
              </div>
            )}
            {inquiry.dietaryRestrictions && (
              <div className="flex gap-2">
                <span className="text-muted-foreground w-24 shrink-0">{t("apply.dietary")}</span>
                <span>{inquiry.dietaryRestrictions}</span>
              </div>
            )}
            {inquiry.specialRequests && (
              <div className="flex gap-2">
                <span className="text-muted-foreground w-24 shrink-0">{t("apply.specialRequests")}</span>
                <span>{inquiry.specialRequests}</span>
              </div>
            )}
          </div>
        )}

        {/* チャットボタン（確定〜完了の間のみ） */}
        {(status === "confirmed" || status === "payment_sent" || status === "payment_received") && (
          <div className="mt-3">
            <Button
              size="sm"
              variant="outline"
              className="w-full sm:w-auto border-primary/40 text-primary hover:bg-primary/5"
              onClick={() => onOpenChat(inquiry.id)}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {t("myInquiries.chatButton")}
            </Button>
          </div>
        )}

        {/* キャンセルボタン */}
        {canCancel && (
          <div className="mt-4 pt-3 border-t border-border">
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
              onClick={() => onCancel(inquiry.id)}
            >
              <XCircle className="w-3.5 h-3.5 mr-1" />
              {t("myInquiries.cancelButton")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── メインページ ────────────────────────────────────────────────────────────────

export default function MyInquiries() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [cancelTargetId, setCancelTargetId] = useState<number | null>(null);
  const [chatInquiryId, setChatInquiryId] = useState<number | null>(null);
  const utils = trpc.useUtils();

  const { data: inquiries, isLoading } = trpc.inquiry.myInquiries.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const cancelMutation = trpc.inquiry.cancel.useMutation({
    onSuccess: () => {
      toast.success(t("myInquiries.cancelSuccess"));
      utils.inquiry.myInquiries.invalidate();
      setCancelTargetId(null);
    },
    onError: (err) => {
      toast.error(err.message);
      setCancelTargetId(null);
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-8 pb-8 text-center">
              <ClipboardList className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">{t("myInquiries.loginRequired")}</h2>
              <p className="text-muted-foreground mb-6">{t("myInquiries.loginRequiredDesc")}</p>
              <Button asChild className="w-full">
                <a href={getLoginUrl()}>{t("nav.login")}</a>
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const activeInquiries = inquiries?.filter((i) => !["completed", "rejected", "cancelled"].includes(i.status)) ?? [];
  const pastInquiries = inquiries?.filter((i) => ["completed", "rejected", "cancelled"].includes(i.status)) ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />
      <div className="container py-8 max-w-3xl">
        {/* ページヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{t("myInquiries.title")}</h1>
            <p className="text-muted-foreground text-sm mt-1">{t("myInquiries.subtitle")}</p>
          </div>
          <Button asChild>
            <Link href="/apply">
              <Plus className="w-4 h-4 mr-2" />
              {t("myInquiries.newApplication")}
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-5 w-32 mb-3" />
                  <Skeleton className="h-2 w-full mb-4 rounded-full" />
                  <Skeleton className="h-16 w-full mb-3 rounded-lg" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !inquiries || inquiries.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("myInquiries.noHistory")}</h3>
              <p className="text-muted-foreground mb-6">
                {t("myInquiries.noHistoryDesc")}
              </p>
              <Button asChild>
                <Link href="/apply">{t("nav.apply")}</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* アクティブな申込 */}
            {activeInquiries.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  {t("myInquiries.activeSection", { count: activeInquiries.length })}
                </h2>
                <div className="space-y-4">
                  {activeInquiries.map((inquiry) => (
                    <InquiryCard
                      key={inquiry.id}
                      inquiry={inquiry}
                      onCancel={setCancelTargetId}
                      onOpenChat={setChatInquiryId}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 過去の申込 */}
            {pastInquiries.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t("myInquiries.pastSection", { count: pastInquiries.length })}
                </h2>
                <div className="space-y-4">
                  {pastInquiries.map((inquiry) => (
                    <InquiryCard
                      key={inquiry.id}
                      inquiry={inquiry}
                      onCancel={setCancelTargetId}
                      onOpenChat={setChatInquiryId}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* チャットダイアログ */}
      <Dialog open={chatInquiryId !== null} onOpenChange={(open) => !open && setChatInquiryId(null)}>
        <DialogContent className="max-w-lg h-[600px] flex flex-col p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>{t("myInquiries.chatTitle")}</DialogTitle>
          </DialogHeader>
          {chatInquiryId && (
            <BookingChat
              inquiryId={chatInquiryId}
              onClose={() => setChatInquiryId(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* キャンセル確認ダイアログ */}
      <AlertDialog open={cancelTargetId !== null} onOpenChange={(open) => !open && setCancelTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("myInquiries.cancelConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("myInquiries.cancelConfirmDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.back")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => cancelTargetId !== null && cancelMutation.mutate({ id: cancelTargetId })}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t("common.processing")}</>
              ) : t("myInquiries.confirmCancel")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}
