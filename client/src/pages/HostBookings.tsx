import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChefHat,
  ChevronDown,
  ChevronUp,
  Clock,
  MessageSquare,
  Users,
  XCircle,
  Banknote,
  Video,
  MapPin,
  Filter,
} from "lucide-react";
import { useState, useMemo } from "react";
import { Link } from "wouter";

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const colorMap: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    pending_payment: "bg-blue-100 text-blue-700 border-blue-200",
    confirmed: "bg-green-100 text-green-700 border-green-200",
    completed: "bg-gray-100 text-gray-700 border-gray-200",
    cancelled_by_guest: "bg-red-100 text-red-700 border-red-200",
    cancelled_by_host: "bg-red-100 text-red-700 border-red-200",
    cancelled_by_admin: "bg-red-100 text-red-700 border-red-200",
  };
  const iconMap: Record<string, React.ReactNode> = {
    pending: <Clock className="w-3 h-3" />,
    pending_payment: <Banknote className="w-3 h-3" />,
    confirmed: <CheckCircle2 className="w-3 h-3" />,
    completed: <CheckCircle2 className="w-3 h-3" />,
    cancelled_by_guest: <XCircle className="w-3 h-3" />,
    cancelled_by_host: <XCircle className="w-3 h-3" />,
    cancelled_by_admin: <XCircle className="w-3 h-3" />,
  };
  const color = colorMap[status] ?? "bg-gray-100 text-gray-600 border-gray-200";
  const icon = iconMap[status] ?? null;
  const label = t(`hostBookings.status.${status}`, { defaultValue: status });
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
      {icon}
      {label}
    </span>
  );
}

// ─── Booking Card ─────────────────────────────────────────────────────────────
function BookingCard({
  booking,
  onConfirm,
  onCancel,
  onComplete,
  isConfirmPending,
  isCancelPending,
  isCompletePending,
}: {
  booking: {
    id: number;
    status: string;
    startTime: Date | string;
    endTime: Date | string;
    adultsCount: number;
    childrenCount: number;
    infantsCount: number | null;
    amountJpy: number;
    hostPayoutJpy: number;
    currency: string;
    amountTotal: number;
    specialRequests?: string | null;
    dietaryRestrictions?: string | null;
    pickupStation?: string | null;
    cancellationReason?: string | null;
    guestSurveyRating?: number | null;
    guestSurveyComment?: string | null;
    guestId: number;
  };
  onConfirm: (id: number) => void;
  onCancel: (id: number, reason: string) => void;
  onComplete: (id: number) => void;
  isConfirmPending: boolean;
  isCancelPending: boolean;
  isCompletePending: boolean;
}) {
  const { t, i18n } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const startDate = new Date(booking.startTime);
  const endDate = new Date(booking.endTime);
  const totalGuests = booking.adultsCount + booking.childrenCount + (booking.infantsCount ?? 0);
  const locale = i18n.language === "ja" ? "ja-JP" : i18n.language === "zh" ? "zh-CN" : i18n.language === "ko" ? "ko-KR" : "en-US";

  // Extract video call times from specialRequests
  const videoCallTimes = useMemo(() => {
    if (!booking.specialRequests) return [];
    const match = booking.specialRequests.match(/\[ビデオ面談希望日時\] ([^|]+)/);
    if (!match) return [];
    return match[1].split(" / ").map((s) => s.trim()).filter(Boolean);
  }, [booking.specialRequests]);

  const otherRequests = useMemo(() => {
    if (!booking.specialRequests) return null;
    const cleaned = booking.specialRequests
      .replace(/\[ビデオ面談希望日時\] [^|]+(\|)?/, "")
      .trim();
    return cleaned || null;
  }, [booking.specialRequests]);

  const isCancelled = booking.status.startsWith("cancelled");

  return (
    <>
      <Card className={`transition-all duration-200 ${isCancelled ? "opacity-60" : "hover:shadow-md"}`}>
        <CardContent className="p-0">
          {/* Header row */}
          <div className="flex items-start justify-between p-4 gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-bold text-foreground">{t("hostBookings.bookingNo", { id: booking.id })}</span>
                <StatusBadge status={booking.status} />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {startDate.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {startDate.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })} 〜 {endDate.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {t("hostBookings.guestCount", {
                    total: totalGuests,
                    adults: booking.adultsCount,
                    children: booking.childrenCount,
                    infants: booking.infantsCount ?? 0,
                  })}
                </span>
              </div>
            </div>

            {/* Amount + actions */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="text-right">
                <p className="font-bold text-foreground text-lg">¥{booking.amountJpy.toLocaleString()}</p>
                <p className="text-xs text-green-600 font-medium">{t("hostBookings.hostPayout")}: ¥{booking.hostPayoutJpy.toLocaleString()}</p>
              </div>

              {/* Action buttons */}
              {booking.status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => onConfirm(booking.id)}
                    disabled={isConfirmPending}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    {t("hostBookings.approve")}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setShowCancelDialog(true)}
                    disabled={isCancelPending}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    {t("hostBookings.decline")}
                  </Button>
                </div>
              )}
              {booking.status === "confirmed" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-green-600 text-green-700 hover:bg-green-50"
                  onClick={() => onComplete(booking.id)}
                  disabled={isCompletePending}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  {t("hostBookings.reportComplete")}
                </Button>
              )}

              {/* Expand toggle */}
              <button
                className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {expanded ? t("common.close") : t("common.viewDetails")}
              </button>
            </div>
          </div>

          {/* Expanded details */}
          {expanded && (
            <div className="border-t border-border px-4 py-4 space-y-3 bg-muted/20">
              {/* Video call times */}
              {videoCallTimes.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                    <Video className="w-3.5 h-3.5 text-primary" />
                    {t("hostBookings.videoCallTimes")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {videoCallTimes.map((time, i) => (
                      <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md font-medium">
                        {t("hostBookings.preference", { n: i + 1 })}: {new Date(time).toLocaleString(locale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Pickup station */}
              {booking.pickupStation && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    {t("hostBookings.pickupStation")}
                  </p>
                  <p className="text-sm text-foreground">{booking.pickupStation}</p>
                </div>
              )}

              {/* Dietary restrictions */}
              {booking.dietaryRestrictions && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    {t("hostBookings.dietary")}
                  </p>
                  <p className="text-sm text-foreground bg-amber-50 border border-amber-200 rounded p-2">{booking.dietaryRestrictions}</p>
                </div>
              )}

              {/* Other special requests */}
              {otherRequests && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-primary" />
                    {t("hostBookings.otherRequests")}
                  </p>
                  <p className="text-sm text-foreground">{otherRequests}</p>
                </div>
              )}

              {/* Cancellation reason */}
              {isCancelled && booking.cancellationReason && (
                <div>
                  <p className="text-xs font-semibold text-red-600 mb-1 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" />
                    {t("hostBookings.cancellationReason")}
                  </p>
                  <p className="text-sm text-foreground">{booking.cancellationReason}</p>
                </div>
              )}

              {/* Guest survey */}
              {booking.guestSurveyRating != null && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                    ⭐ {t("hostBookings.guestReview")}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{booking.guestSurveyRating} / 5</span>
                    {booking.guestSurveyComment && (
                      <span className="text-sm text-muted-foreground">「{booking.guestSurveyComment}」</span>
                    )}
                  </div>
                </div>
              )}

              {/* Guest ID */}
              <p className="text-xs text-muted-foreground">{t("hostBookings.guestId")}: #{booking.guestId}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("hostBookings.declineTitle", { id: booking.id })}</DialogTitle>
            <DialogDescription>
              {t("hostBookings.declineDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="cancel-reason">{t("hostBookings.declineReasonLabel")}</Label>
            <Textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder={t("hostBookings.declineReasonPlaceholder")}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              {t("common.back")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onCancel(booking.id, cancelReason);
                setShowCancelDialog(false);
                setCancelReason("");
              }}
              disabled={isCancelPending}
            >
              <XCircle className="w-4 h-4 mr-2" />
              {t("hostBookings.declineConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HostBookings() {
  const { t } = useTranslation();
  const { isAuthenticated, loading } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: myHost } = trpc.host.getMyHost.useQuery(undefined, { enabled: isAuthenticated });
  const { data: hostBookings, refetch } = trpc.booking.hostBookings.useQuery(undefined, { enabled: isAuthenticated });

  const confirmBooking = trpc.booking.confirm.useMutation({
    onSuccess: () => { toast.success(t("hostBookings.approvedSuccess")); refetch(); },
    onError: (err: { message: string }) => toast.error(err.message),
  });
  const cancelBooking = trpc.booking.cancel.useMutation({
    onSuccess: () => { toast.success(t("hostBookings.declinedSuccess")); refetch(); },
    onError: (err: { message: string }) => toast.error(err.message),
  });
  const completeBooking = trpc.booking.complete.useMutation({
    onSuccess: () => { toast.success(t("hostBookings.completedSuccess")); refetch(); },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  // Filter bookings
  const filteredBookings = useMemo(() => {
    if (!hostBookings) return [];
    return hostBookings.filter((b) => {
      const matchStatus = statusFilter === "all" || b.status === statusFilter;
      const matchSearch = searchQuery === "" || String(b.id).includes(searchQuery);
      return matchStatus && matchSearch;
    });
  }, [hostBookings, statusFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => ({
    pending: hostBookings?.filter((b) => b.status === "pending").length ?? 0,
    confirmed: hostBookings?.filter((b) => b.status === "confirmed").length ?? 0,
    completed: hostBookings?.filter((b) => b.status === "completed").length ?? 0,
    totalRevenue: hostBookings?.filter((b) => b.status === "completed").reduce((sum, b) => sum + b.hostPayoutJpy, 0) ?? 0,
  }), [hostBookings]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
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
          <div className="text-center">
            <p className="text-muted-foreground mb-4">{t("common.loginRequired")}</p>
            <a href={getLoginUrl()}><Button>{t("nav.login")}</Button></a>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!myHost) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <ChefHat className="w-16 h-16 text-primary/30 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">{t("hostBookings.hostRequired")}</h2>
            <p className="text-muted-foreground mb-4">{t("hostBookings.hostRequiredDesc")}</p>
            <Link href="/host/register"><Button>{t("host.becomeHost")}</Button></Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="container py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("hostBookings.title")}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{t("hostBookings.subtitle")}</p>
          </div>
          <Link href="/host/dashboard">
            <Button variant="outline" size="sm">← {t("hostBookings.toDashboard")}</Button>
          </Link>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { labelKey: "hostBookings.statPending", value: stats.pending, color: "text-amber-600", bg: "bg-amber-50", icon: <Clock className="w-5 h-5 text-amber-500" /> },
            { labelKey: "hostBookings.statConfirmed", value: stats.confirmed, color: "text-green-600", bg: "bg-green-50", icon: <CheckCircle2 className="w-5 h-5 text-green-500" /> },
            { labelKey: "hostBookings.statCompleted", value: stats.completed, color: "text-gray-600", bg: "bg-gray-50", icon: <CheckCircle2 className="w-5 h-5 text-gray-400" /> },
            { labelKey: "hostBookings.statRevenue", value: `¥${stats.totalRevenue.toLocaleString()}`, color: "text-primary", bg: "bg-primary/5", icon: <Banknote className="w-5 h-5 text-primary" /> },
          ].map((stat, i) => (
            <Card key={i} className={`${stat.bg} border-0`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  {stat.icon}
                  <span className="text-xs text-muted-foreground">{t(stat.labelKey)}</span>
                </div>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex items-center gap-2 flex-1">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t("hostBookings.filterByStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                <SelectItem value="pending">{t("hostBookings.status.pending")}</SelectItem>
                <SelectItem value="pending_payment">{t("hostBookings.status.pending_payment")}</SelectItem>
                <SelectItem value="confirmed">{t("hostBookings.status.confirmed")}</SelectItem>
                <SelectItem value="completed">{t("hostBookings.status.completed")}</SelectItem>
                <SelectItem value="cancelled_by_guest">{t("hostBookings.status.cancelled_by_guest")}</SelectItem>
                <SelectItem value="cancelled_by_host">{t("hostBookings.status.cancelled_by_host")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input
            placeholder={t("hostBookings.searchById")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-48"
          />
        </div>

        {/* Booking list */}
        {filteredBookings.length > 0 ? (
          <div className="space-y-3">
            {/* Urgent: pending bookings first */}
            {filteredBookings.filter((b) => b.status === "pending").length > 0 && statusFilter === "all" && (
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <p className="text-sm font-semibold text-amber-700">
                  {t("hostBookings.pendingAlert", { count: filteredBookings.filter((b) => b.status === "pending").length })}
                </p>
              </div>
            )}
            {filteredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onConfirm={(id) => confirmBooking.mutate({ id })}
                onCancel={(id, reason) => cancelBooking.mutate({ id, reason })}
                onComplete={(id) => completeBooking.mutate({ id })}
                isConfirmPending={confirmBooking.isPending}
                isCancelPending={cancelBooking.isPending}
                isCompletePending={completeBooking.isPending}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <CalendarDays className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">
              {statusFilter === "all" ? t("hostBookings.noBookings") : t("hostBookings.noBookingsFiltered", { status: t(`hostBookings.status.${statusFilter}`, { defaultValue: statusFilter }) })}
            </p>
            <p className="text-sm mt-1">{t("hostBookings.addAvailabilityHint")}</p>
            <Link href="/host/calendar">
              <Button variant="outline" className="mt-4">
                <CalendarDays className="w-4 h-4 mr-2" />
                {t("hostBookings.manageAvailability")}
              </Button>
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
