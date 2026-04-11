import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  Users,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  ChefHat,
  CreditCard,
  TriangleAlert,
} from "lucide-react";
import { useTranslation } from "react-i18next";

type BookingStatus =
  | "pending"
  | "pending_payment"
  | "deposit_paid"            // 2段階決済: 20%仮押さえ済み
  | "awaiting_final_payment"  // 2段階決済: 80%本決済待ち
  | "confirmed"
  | "completed"
  | "cancelled_by_guest"
  | "cancelled_by_host"
  | "cancelled_by_admin";

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="focus:outline-none"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
        >
          <Star
            className={`w-8 h-8 transition-colors ${
              star <= (hovered || value)
                ? "fill-amber-400 text-amber-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function MyBookings() {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();

  const { data: bookings, isLoading } = trpc.booking.myBookings.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Cancel dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelBookingId, setCancelBookingId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  // Survey dialog state
  const [surveyDialogOpen, setSurveyDialogOpen] = useState(false);
  const [surveyBookingId, setSurveyBookingId] = useState<number | null>(null);
  const [surveyRating, setSurveyRating] = useState(5);
  const [surveyComment, setSurveyComment] = useState("");

  const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; icon: React.ReactNode }> = {
    pending: {
      label: t("booking.status.pending"),
      color: "bg-amber-100 text-amber-800 border-amber-200",
      icon: <Clock className="w-3 h-3" />,
    },
    pending_payment: {
      label: t("booking.status.pendingPayment"),
      color: "bg-orange-100 text-orange-800 border-orange-200",
      icon: <CreditCard className="w-3 h-3" />,
    },
    deposit_paid: {
      label: "仮押さえ済（20%）",
      color: "bg-blue-100 text-blue-800 border-blue-200",
      icon: <CreditCard className="w-3 h-3" />,
    },
    awaiting_final_payment: {
      label: "本決済待ち（80%）",
      color: "bg-purple-100 text-purple-800 border-purple-200",
      icon: <CreditCard className="w-3 h-3" />,
    },
    confirmed: {
      label: t("booking.status.confirmed"),
      color: "bg-emerald-100 text-emerald-800 border-emerald-200",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    completed: {
      label: t("booking.status.completed"),
      color: "bg-blue-100 text-blue-800 border-blue-200",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    cancelled_by_guest: {
      label: t("booking.status.cancelledByGuest"),
      color: "bg-red-100 text-red-800 border-red-200",
      icon: <XCircle className="w-3 h-3" />,
    },
    cancelled_by_host: {
      label: t("booking.status.cancelledByHost"),
      color: "bg-red-100 text-red-800 border-red-200",
      icon: <XCircle className="w-3 h-3" />,
    },
    cancelled_by_admin: {
      label: t("booking.status.cancelledByAdmin"),
      color: "bg-red-100 text-red-800 border-red-200",
      icon: <XCircle className="w-3 h-3" />,
    },
  };

  const cancelMutation = trpc.booking.cancel.useMutation({
    onSuccess: () => {
      toast.success(t("booking.cancelSuccess"), { description: t("booking.cancelSuccessDesc") });
      setCancelDialogOpen(false);
      setCancelReason("");
      utils.booking.myBookings.invalidate();
    },
    onError: (err) => {
      toast.error(t("common.error"), { description: err.message });
    },
  });

  const surveyMutation = trpc.booking.submitSurvey.useMutation({
    onSuccess: () => {
      toast.success(t("booking.surveySuccess"), { description: t("booking.surveySuccessDesc") });
      setSurveyDialogOpen(false);
      setSurveyComment("");
      setSurveyRating(5);
      utils.booking.myBookings.invalidate();
    },
    onError: (err) => {
      toast.error(t("common.error"), { description: err.message });
    },
  });

  function formatDateTime(dt: Date | string) {
    const locale = i18n.language.startsWith("ja") ? "ja-JP"
      : i18n.language.startsWith("zh") ? "zh-CN"
      : i18n.language.startsWith("ko") ? "ko-KR"
      : "en-US";
    return new Date(dt).toLocaleString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatPrice(amountJpy: number, currency: string, amountTotal: number) {
    if (currency === "JPY") return `¥${amountJpy.toLocaleString()}`;
    return `${currency} ${amountTotal.toLocaleString()} (¥${amountJpy.toLocaleString()})`;
  }

  if (loading || isLoading) {
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md text-center p-8">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">{t("common.loginRequired")}</h2>
            <p className="text-muted-foreground mb-6">{t("booking.loginToView")}</p>
            <Button asChild>
              <a href={getLoginUrl()}>{t("nav.login")}</a>
            </Button>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const activeBookings = bookings?.filter((b) =>
    ["pending", "pending_payment", "deposit_paid", "awaiting_final_payment", "confirmed"].includes(b.status)
  ) ?? [];
  const pastBookings = bookings?.filter((b) =>
    ["completed", "cancelled_by_guest", "cancelled_by_host", "cancelled_by_admin"].includes(b.status)
  ) ?? [];

  function BookingCard({ booking }: { booking: NonNullable<typeof bookings>[0] }) {
    const status = booking.status as BookingStatus;
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
    const canCancel = ["pending", "pending_payment", "deposit_paid", "awaiting_final_payment", "confirmed"].includes(booking.status);
    const canSurvey = booking.status === "completed" && !booking.guestSurveySubmittedAt;
    const hasSurvey = booking.status === "completed" && !!booking.guestSurveySubmittedAt;
    const needsDepositPayment = booking.status === "pending_payment" || booking.status === "pending";
    const needsFinalPayment = booking.status === "awaiting_final_payment";
    const isDepositPaid = booking.status === "deposit_paid";

    const [isRedirecting, setIsRedirecting] = useState(false);

    // 2段階決済 STEP1: 20%仮押さえ
    const depositCheckoutMutation = trpc.stripe.createDepositCheckoutSession.useMutation({
      onSuccess: (data) => {
        if (data.checkoutUrl) window.location.href = data.checkoutUrl;
      },
      onError: (err) => {
        setIsRedirecting(false);
        toast.error(t("booking.paymentError"), { description: err.message });
      },
    });

    // 2段階決済 STEP2: 80%本決済
    const finalCheckoutMutation = trpc.stripe.createFinalPaymentCheckoutSession.useMutation({
      onSuccess: (data) => {
        if (data.checkoutUrl) window.location.href = data.checkoutUrl;
      },
      onError: (err) => {
        setIsRedirecting(false);
        toast.error(t("booking.paymentError"), { description: err.message });
      },
    });

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold">{t("booking.bookingId", { id: booking.id })}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("booking.appliedOn")}：{new Date(booking.createdAt).toLocaleDateString(i18n.language)}
              </p>
            </div>
            <Badge variant="outline" className={`flex items-center gap-1 text-xs ${cfg.color}`}>
              {cfg.icon}
              {cfg.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Date & Time */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
            <span>{formatDateTime(booking.startTime)}</span>
          </div>

          {/* Pickup station */}
          {booking.pickupStation && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>{t("booking.meetingPoint")}：{booking.pickupStation}</span>
            </div>
          )}

          {/* Guests */}
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-muted-foreground shrink-0" />
            <span>
              {t("booking.adults")} {booking.adultsCount}{t("common.person")}
              {booking.childrenCount > 0 && `・${t("booking.children")} ${booking.childrenCount}${t("common.person")}`}
              {(booking.infantsCount ?? 0) > 0 && `・${t("booking.infants")} ${booking.infantsCount}${t("common.person")}`}
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("booking.totalAmount")}</span>
            <span className="font-semibold text-base">
              {formatPrice(booking.amountJpy, booking.currency, booking.amountTotal)}
            </span>
          </div>

          {/* Dietary */}
          {booking.dietaryRestrictions && (
            <div className="text-sm bg-muted/50 rounded p-2">
              <span className="text-muted-foreground">{t("booking.dietary")}：</span>
              {booking.dietaryRestrictions}
            </div>
          )}

          {/* Survey result (already submitted) */}
          {hasSurvey && (
            <div className="flex items-center gap-2 text-sm bg-blue-50 rounded p-2">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-medium">{booking.guestSurveyRating}{t("booking.points")}</span>
              {booking.guestSurveyComment && (
                <span className="text-muted-foreground truncate">{booking.guestSurveyComment}</span>
              )}
              <span className="ml-auto text-xs text-muted-foreground">{t("booking.surveySubmitted")}</span>
            </div>
          )}

          {/* Payment Banner: 20%仮押さえ待ち */}
          {needsDepositPayment && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm space-y-2">
              <p className="text-orange-700 font-medium">
                ⚠️ 20%の仮押さえ金のお支払いが完了していません
              </p>
              <div className="text-xs text-orange-600 space-y-0.5">
                <div className="flex justify-between">
                  <span>仮押さえ金（20%）</span>
                  <span className="font-bold">¥{Math.floor((booking.amountJpy ?? 0) * 0.2).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>本決済（80%）はホスト確定後</span>
                  <span>¥{(booking.amountJpy - Math.floor((booking.amountJpy ?? 0) * 0.2)).toLocaleString()}</span>
                </div>
              </div>
              <Button
                size="sm"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white gap-2"
                disabled={depositCheckoutMutation.isPending || isRedirecting}
                onClick={() => {
                  setIsRedirecting(true);
                  depositCheckoutMutation.mutate({
                    bookingId: booking.id,
                    currency: "JPY",
                    successPath: "/payment/deposit-success",
                    cancelPath: "/payment/cancel",
                  });
                }}
              >
                {(depositCheckoutMutation.isPending || isRedirecting) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                20%仮押さえを支払う ¥{Math.floor((booking.amountJpy ?? 0) * 0.2).toLocaleString()}
              </Button>
            </div>
          )}

          {/* Payment Banner: 仮押さえ済み（ホスト調整中） */}
          {isDepositPaid && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm space-y-1">
              <p className="text-blue-700 font-medium">✅ 仮押さえ済み — ホストとの日程調整中</p>
              <p className="text-xs text-blue-600">スタッフがホストに連絡中です。通常1～3営業日以内にご連絡します。</p>
              <div className="flex justify-between text-xs">
                <span>残ら80%の本決済額</span>
                <span className="font-bold">¥{(booking.amountJpy - Math.floor((booking.amountJpy ?? 0) * 0.2)).toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Payment Banner: 80%本決済待ち */}
          {needsFinalPayment && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm space-y-2">
              <p className="text-purple-700 font-medium">
                🎉 ホストが確定しました！残ら80%のお支払いをお願いします
              </p>
              <div className="flex justify-between text-xs text-purple-600">
                <span>本決済額（80%）</span>
                <span className="font-bold">¥{(booking.amountJpy - Math.floor((booking.amountJpy ?? 0) * 0.2)).toLocaleString()}</span>
              </div>
              <Button
                size="sm"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2"
                disabled={finalCheckoutMutation.isPending || isRedirecting}
                onClick={() => {
                  setIsRedirecting(true);
                  finalCheckoutMutation.mutate({
                    bookingId: booking.id,
                    currency: "JPY",
                    successPath: "/payment/success",
                    cancelPath: "/payment/cancel",
                  });
                }}
              >
                {(finalCheckoutMutation.isPending || isRedirecting) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                残ら80%を支払って予約確定 ¥{(booking.amountJpy - Math.floor((booking.amountJpy ?? 0) * 0.2)).toLocaleString()}
              </Button>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1 flex-wrap">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/bookings/${booking.id}`}>{t("home.viewDetails")}</Link>
            </Button>
            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => {
                  setCancelBookingId(booking.id);
                  setCancelDialogOpen(true);
                }}
              >
                <XCircle className="w-3.5 h-3.5 mr-1" />
                {t("booking.cancel")}
              </Button>
            )}
            {canSurvey && (
              <Button
                size="sm"
                className="bg-amber-500 hover:bg-amber-600 text-white"
                onClick={() => {
                  setSurveyBookingId(booking.id);
                  setSurveyRating(5);
                  setSurveyComment("");
                  setSurveyDialogOpen(true);
                }}
              >
                <Star className="w-3.5 h-3.5 mr-1" />
                {t("booking.answerSurvey")}
              </Button>
            )}
            {(booking.status === "completed" || booking.status === "confirmed") && (
              <Link href={`/trouble/report?bookingId=${booking.id}`}>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-amber-600 border-amber-200 hover:bg-amber-50"
                >
                  <TriangleAlert className="w-3.5 h-3.5 mr-1" />
                  {t("booking.reportTrouble")}
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Page header */}
      <div className="bg-white border-b">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t("booking.myBookings")}</h1>
              <p className="text-muted-foreground text-sm mt-1">
                {t("booking.bookingListFor", { name: user?.name ?? t("common.guest") })}
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/experiences">{t("nav.experiences")}</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-8 flex-1 space-y-10">
        {!bookings || bookings.length === 0 ? (
          <div className="text-center py-16">
            <ChefHat className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-semibold mb-2">{t("booking.noBookings")}</h3>
            <p className="text-muted-foreground mb-6">
              {t("booking.noBookingsDesc")}
            </p>
            <Button asChild>
              <Link href="/experiences">{t("nav.experiences")}</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Active bookings */}
            {activeBookings.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  {t("booking.activeBookings")}
                  <Badge variant="secondary">{activeBookings.length}</Badge>
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {activeBookings.map((b) => (
                    <BookingCard key={b.id} booking={b} />
                  ))}
                </div>
              </section>
            )}

            {/* Past bookings */}
            {pastBookings.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  {t("booking.pastBookings")}
                  <Badge variant="secondary">{pastBookings.length}</Badge>
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {pastBookings.map((b) => (
                    <BookingCard key={b.id} booking={b} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <Footer />

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("booking.cancelConfirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("booking.cancelConfirmDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("booking.cancelReason")}</label>
            <Textarea
              placeholder={t("booking.cancelReasonPlaceholder")}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              {t("common.back")}
            </Button>
            <Button
              variant="destructive"
              disabled={cancelMutation.isPending}
              onClick={() => {
                if (!cancelBookingId) return;
                cancelMutation.mutate({
                  id: cancelBookingId,
                  reason: cancelReason || undefined,
                });
              }}
            >
              {cancelMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {t("booking.cancelConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Survey Dialog */}
      <Dialog open={surveyDialogOpen} onOpenChange={setSurveyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("booking.surveyTitle")}</DialogTitle>
            <DialogDescription>
              {t("booking.surveyDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2">{t("booking.overallRating")}</label>
              <StarRating value={surveyRating} onChange={setSurveyRating} />
              <p className="text-sm text-muted-foreground mt-1">
                {[
                  "",
                  t("booking.rating1"),
                  t("booking.rating2"),
                  t("booking.rating3"),
                  t("booking.rating4"),
                  t("booking.rating5"),
                ][surveyRating]}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">{t("booking.comment")}</label>
              <Textarea
                placeholder={t("booking.commentPlaceholder")}
                value={surveyComment}
                onChange={(e) => setSurveyComment(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSurveyDialogOpen(false)}>
              {t("booking.answerLater")}
            </Button>
            <Button
              disabled={surveyMutation.isPending || surveyRating === 0}
              onClick={() => {
                if (!surveyBookingId) return;
                surveyMutation.mutate({
                  bookingId: surveyBookingId,
                  rating: surveyRating,
                  comment: surveyComment || undefined,
                });
              }}
            >
              {surveyMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {t("common.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
