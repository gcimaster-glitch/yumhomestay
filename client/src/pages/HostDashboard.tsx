import Footer from "@/components/Footer";
import { ReviewCard } from "@/components/ReviewSection";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { AlertCircle, BookOpen, CalendarDays, ChefHat, CheckCircle2, ChevronLeft, ChevronRight, Clock, DollarSign, Info, MessageSquare, Plus, Reply, Send, ShieldCheck, Star, Trash2, Users, Video, XCircle } from "lucide-react";
import { TrendBadge } from "@/components/TrendBadge";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";

export default function HostDashboard() {
  const { t } = useTranslation();
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [showNewExp, setShowNewExp] = useState(false);

  // New experience form state
  const [titleEn, setTitleEn] = useState("");
  const [titleJa, setTitleJa] = useState("");
  const [descEn, setDescEn] = useState("");
  const [descJa, setDescJa] = useState("");
  const [priceJpy, setPriceJpy] = useState(5000);
  const [duration, setDuration] = useState(180);
  const [maxGuests, setMaxGuests] = useState(6);
  const [cuisineType, setCuisineType] = useState("japanese");
  const [expType, setExpType] = useState<"cooking" | "culture" | "both">("cooking");

  const { data: myHost } = trpc.host.getMyHost.useQuery(undefined, { enabled: isAuthenticated });
  const { data: myExperiences, refetch: refetchExperiences } = trpc.experience.getMyExperiences.useQuery(undefined, { enabled: isAuthenticated });
  const { data: hostBookings } = trpc.booking.hostBookings.useQuery(undefined, { enabled: isAuthenticated });
  const { data: payoutSummary } = trpc.payment.hostPayoutSummary.useQuery(undefined, { enabled: isAuthenticated });
  const { data: chatUnreadCount } = trpc.chat.getUnreadCount.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 30000 });
  const { data: myHostReviews, refetch: refetchHostReviews } = trpc.review.getMyHostReviews.useQuery(undefined, { enabled: isAuthenticated });
  const { data: hostChatThreads, refetch: refetchHostChats } = trpc.chat.hostGetThreads.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 30000 });
  const [selectedChatInquiryId, setSelectedChatInquiryId] = useState<number | null>(null);
  const [hostReplyText, setHostReplyText] = useState("");
  const { data: selectedChatMessages, refetch: refetchChatMessages } = trpc.chat.getMessages.useQuery(
    { inquiryId: selectedChatInquiryId! },
    { enabled: selectedChatInquiryId !== null, refetchInterval: 10000 }
  );
  const hostReply = trpc.chat.hostReply.useMutation({
    onSuccess: () => {
      setHostReplyText("");
      void refetchChatMessages();
      void refetchHostChats();
    },
    onError: () => toast.error(t("hostDashboard.replyFailed")),
  });

  const createExp = trpc.experience.create.useMutation({
    onSuccess: () => {
      toast.success(t("hostDashboard.experienceCreated"));
      setShowNewExp(false);
      setTitleEn(""); setTitleJa(""); setDescEn(""); setDescJa("");
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  const confirmBooking = trpc.booking.confirm.useMutation({
    onSuccess: () => toast.success(t("hostDashboard.bookingConfirmed")),
    onError: (err: { message: string }) => toast.error(err.message),
  });
  const cancelBooking = trpc.booking.cancel.useMutation({
    onSuccess: () => toast.success(t("hostDashboard.bookingCancelled")),
    onError: (err: { message: string }) => toast.error(err.message),
  });
  const completeBooking = trpc.booking.complete.useMutation({
    onSuccess: () => toast.success(t("hostDashboard.bookingCompleted")),
    onError: (err: { message: string }) => toast.error(err.message),
  });

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
            <h2 className="text-xl font-bold mb-2">{t("hostDashboard.hostRegistrationRequired")}</h2>
            <p className="text-muted-foreground mb-4">{t("hostDashboard.hostRegistrationRequiredDesc")}</p>
            <Button onClick={() => navigate("/host/register")}>{t("host.becomeHost")}</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const pendingBookings = hostBookings?.filter((b) => b.status === "pending") ?? [];
  const confirmedBookings = hostBookings?.filter((b) => b.status === "confirmed") ?? [];
  const avgRating = myHostReviews && myHostReviews.length > 0
    ? (myHostReviews.reduce((sum, r) => sum + (r.ratingOverall ?? 0), 0) / myHostReviews.length).toFixed(1)
    : null;

  // ─── Status Banner Helper ────────────────────────────────────────────────
  const renderStatusBanner = () => {
    if (!myHost) return null;
    const { approvalStatus, registrationFeePaid, interviewScheduledAt, certificationIssuedAt } = myHost;

    // 1. 登録料未払い（pending + 未払い）
    if (!registrationFeePaid && approvalStatus === "pending") {
      return (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-amber-800 mb-1">{t("hostDashboard.step2PaymentRequired")}</p>
            <p className="text-sm text-amber-700 mb-3">{t("hostDashboard.step2PaymentDesc")}</p>
            <Link href="/host/register?step=payment">
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                {t("hostDashboard.payRegistrationFee")}
              </Button>
            </Link>
          </div>
        </div>
      );
    }

    // 2. 登録料支払い済み・審査待ち
    if (registrationFeePaid && approvalStatus === "pending") {
      const interviewPrefs = myHost.certificationDetails?.replace(t("hostDashboard.preferredInterviewTime") + ": ", "") ?? "";
      return (
        <div className="mb-6 rounded-xl border border-blue-300 bg-blue-50 p-4 flex items-start gap-3">
          <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-blue-800 mb-1">{t("hostDashboard.step3UnderReview")}</p>
            <p className="text-sm text-blue-700">{t("hostDashboard.step3UnderReviewDesc")}</p>
            {interviewPrefs && (
              <p className="text-xs text-blue-600 mt-2 bg-blue-100 px-2 py-1 rounded">
                {t("hostDashboard.preferredInterviewTime")}: {interviewPrefs}
              </p>
            )}
          </div>
        </div>
      );
    }

    // 3. ZOOM面談中
    if (approvalStatus === "interview") {
      return (
        <div className="mb-6 rounded-xl border border-purple-300 bg-purple-50 p-4 flex items-start gap-3">
          <Video className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-purple-800 mb-1">{t("hostDashboard.step4ZoomScheduled")}</p>
            {interviewScheduledAt ? (
              <p className="text-sm text-purple-700">
                {t("hostDashboard.preferredInterviewTime")}: <strong>{new Date(interviewScheduledAt).toLocaleString()}</strong>
                <br />{t("hostDashboard.zoomJoinNote")}
              </p>
            ) : (
              <p className="text-sm text-purple-700">
                {t("hostDashboard.zoomScheduleConfirmed")}
              </p>
            )}
          </div>
        </div>
      );
    }

    // 4. 認定済み
    if (approvalStatus === "approved") {
      return (
        <div className="mb-6 rounded-xl border border-green-300 bg-green-50 p-4 flex items-start gap-3 overflow-hidden relative">
          {/* パパコックキャラクター（サムズアップ） */}
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/FWh8vTLvqLGbaqKezVTx6W/pose03_papa_e50230b2.png"
            alt="Papa Cook"
            className="absolute right-2 bottom-0 h-24 opacity-90 pointer-events-none select-none"
          />
          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="pr-24">
            <p className="font-semibold text-green-800 mb-1">{t("hostDashboard.yumHostCertified")}</p>
            <p className="text-sm text-green-700">
              {t("hostDashboard.congratsCertified")}
              {certificationIssuedAt && (
                <span> {t("hostDashboard.certIssuedAt")}: {new Date(certificationIssuedAt).toLocaleDateString()}。</span>
              )}
              {t("hostDashboard.registerAvailabilityPrompt")}
            </p>
            <div className="flex gap-2 mt-2">
              <Link href="/host/calendar">
                <Button size="sm" variant="outline" className="border-green-600 text-green-700 hover:bg-green-100">
                  <CalendarDays className="w-3.5 h-3.5 mr-1" />
                  {t("hostDashboard.registerAvailability")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    // 5. 却下
    if (approvalStatus === "rejected") {
      return (
        <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-800 mb-1">{t("hostDashboard.rejectedTitle")}</p>
            <p className="text-sm text-red-700 mb-2">{t("hostDashboard.rejectedDesc")}</p>
            <Link href="/contact">
              <Button size="sm" variant="outline" className="border-red-400 text-red-700">
                {t("nav.contact")}
              </Button>
            </Link>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="container py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold">{t("host.dashboard")}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={myHost.approvalStatus === "approved" ? "default" : myHost.approvalStatus === "pending" ? "secondary" : "destructive"}>
                {myHost.approvalStatus}
              </Badge>
              {myHost.kycStatus === "verified" ? (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <ShieldCheck className="w-3 h-3 mr-1" /> {t("hostDashboard.kycVerified")}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-amber-600 border-amber-600">
                  {t("hostDashboard.kycPending")}
                </Badge>
              )}
            </div>
          </div>
          {myHost.approvalStatus === "approved" && (
            <div className="flex flex-wrap gap-2">
              <Link href="/host/calendar">
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  <CalendarDays className="w-4 h-4 mr-2" />
                  {t("hostDashboard.manageAvailability")}
                </Button>
              </Link>
              <Button size="sm" className="w-full sm:w-auto" onClick={() => setShowNewExp(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t("experience.create")}
              </Button>
            </div>
          )}
        </div>

        {/* Status Banner */}
        {renderStatusBanner()}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
          {([
            {
              icon: <BookOpen className="w-5 h-5 text-primary" />,
              label: t("hostDashboard.experienceCount"),
              value: myExperiences?.length ?? 0,
              trend: null,
            },
            {
              icon: <CalendarDays className="w-5 h-5 text-primary" />,
              label: t("hostDashboard.pendingBookings"),
              value: pendingBookings.length,
              trend: null,
            },
            {
              icon: <CalendarDays className="w-5 h-5 text-primary" />,
              label: t("hostDashboard.confirmedBookings"),
              value: confirmedBookings.length,
              trend: payoutSummary ? { current: payoutSummary.currentMonthBookings, previous: payoutSummary.lastMonthBookings } : null,
            },
            {
              icon: <DollarSign className="w-5 h-5 text-primary" />,
              label: t("hostDashboard.monthlyRevenue"),
              value: `¥${(payoutSummary?.currentMonthJpy ?? 0).toLocaleString()}`,
              trend: payoutSummary ? { current: payoutSummary.currentMonthJpy, previous: payoutSummary.lastMonthJpy } : null,
            },
            {
              icon: <Star className="w-5 h-5 text-amber-500" />,
              label: t("hostDashboard.avgRating"),
              value: avgRating ? `★ ${avgRating}` : "—",
              trend: null,
            },
          ] as Array<{ icon: React.ReactNode; label: string; value: string | number; trend: { current: number; previous: number } | null }>).map((stat, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  {stat.icon}
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                {stat.trend && (
                  <div className="mt-1">
                    <TrendBadge current={stat.trend.current} previous={stat.trend.previous} unit="" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="bookings">
          <TabsList className="flex-wrap h-auto gap-1 sm:flex-nowrap sm:h-10 overflow-x-auto">
            <TabsTrigger value="bookings" className="relative">
              {t("hostDashboard.bookingManagement")}
              {chatUnreadCount && chatUnreadCount > 0 ? (
                <span className="ml-1.5 inline-flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4">
                  {chatUnreadCount > 9 ? "9+" : chatUnreadCount}
                </span>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="chat" className="relative">
              <MessageSquare className="w-4 h-4 mr-1" />
              {t("hostDashboard.chat")}
              {chatUnreadCount && chatUnreadCount > 0 ? (
                <span className="ml-1 inline-flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4">
                  {chatUnreadCount > 9 ? "9+" : chatUnreadCount}
                </span>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <CalendarDays className="w-4 h-4 mr-1" />
              {t("hostDashboard.calendar")}
            </TabsTrigger>
            <TabsTrigger value="experiences">{t("hostDashboard.experienceManagement")}</TabsTrigger>
            <TabsTrigger value="payout">{t("hostDashboard.revenueReport")}</TabsTrigger>
            <TabsTrigger value="reviews">
              <Star className="w-4 h-4 mr-1" />
              {t("review.reviewsTitle")}
              {myHostReviews && myHostReviews.filter((r) => !r.replyByHost).length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center bg-amber-500 text-white text-[10px] font-bold rounded-full w-4 h-4">
                  {myHostReviews.filter((r) => !r.replyByHost).length > 9 ? "9+" : myHostReviews.filter((r) => !r.replyByHost).length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Chat tab */}
          <TabsContent value="chat" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[400px] md:h-[clamp(400px,calc(100vh-280px),700px)]">
              {/* Thread list */}
              <div className="border rounded-lg overflow-y-auto">
                <div className="p-3 border-b bg-muted/30">
                  <h3 className="font-semibold text-sm">{t("hostDashboard.chatThreads")}</h3>
                </div>
                {hostChatThreads && hostChatThreads.length > 0 ? (
                  Object.entries(
                    hostChatThreads.reduce((acc: Record<string, typeof hostChatThreads[0]>, msg) => {
                      const key = String(msg.inquiryId ?? msg.bookingId ?? "?");
                      if (!acc[key] || new Date(msg.createdAt) > new Date(acc[key].createdAt)) {
                        acc[key] = msg;
                      }
                      return acc;
                    }, {})
                  ).map(([, latestMsg]) => (
                    <button
                      key={String(latestMsg.inquiryId ?? latestMsg.bookingId)}
                      className={`w-full text-left p-3 border-b hover:bg-muted/50 transition-colors ${
                        selectedChatInquiryId === latestMsg.inquiryId ? "bg-primary/10" : ""
                      }`}
                      onClick={() => setSelectedChatInquiryId(latestMsg.inquiryId ?? null)}
                    >
                      <p className="text-sm font-medium">{t("hostDashboard.inquiry")} #{latestMsg.inquiryId ?? latestMsg.bookingId}</p>
                      <p className="text-xs text-muted-foreground truncate">{latestMsg.content}</p>
                      <p className="text-xs text-muted-foreground">{new Date(latestMsg.createdAt).toLocaleString()}</p>
                      {!latestMsg.isReadByAdmin && latestMsg.senderRole !== "host" && (
                        <span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-1" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>{t("hostDashboard.noChats")}</p>
                  </div>
                )}
              </div>
              {/* Message panel */}
              <div className="md:col-span-2 border rounded-lg flex flex-col overflow-hidden">
                {selectedChatInquiryId ? (
                  <>
                    <div className="p-3 border-b bg-muted/30 flex-shrink-0">
                      <h3 className="font-semibold text-sm">{t("hostDashboard.inquiry")} #{selectedChatInquiryId} {t("hostDashboard.chatOf")}</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {selectedChatMessages?.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.senderRole === "host" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                            msg.senderRole === "host" ? "bg-primary text-primary-foreground"
                            : msg.senderRole === "ai" ? "bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100"
                            : msg.senderRole === "admin" ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                            : "bg-muted"
                          }`}>
                            <p className="text-xs font-semibold mb-1 opacity-70">
                              {msg.senderRole === "host" ? t("hostDashboard.roleHost") : msg.senderRole === "ai" ? t("hostDashboard.roleAI") : msg.senderRole === "admin" ? t("hostDashboard.roleStaff") : t("hostDashboard.roleGuest")}
                            </p>
                            <p>{msg.content}</p>
                            <p className="text-xs opacity-50 mt-1">{new Date(msg.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t flex gap-2 flex-shrink-0">
                      <Textarea
                        value={hostReplyText}
                        onChange={(e) => setHostReplyText(e.target.value)}
                        placeholder={t("hostDashboard.replyPlaceholder")}
                        rows={2}
                        className="flex-1 resize-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey && hostReplyText.trim() && selectedChatInquiryId) {
                            e.preventDefault();
                            hostReply.mutate({ inquiryId: selectedChatInquiryId, content: hostReplyText.trim() });
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        disabled={!hostReplyText.trim() || hostReply.isPending}
                        onClick={() => {
                          if (hostReplyText.trim() && selectedChatInquiryId) {
                            hostReply.mutate({ inquiryId: selectedChatInquiryId, content: hostReplyText.trim() });
                          }
                        }}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>{t("hostDashboard.selectThread")}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Calendar tab */}
          <TabsContent value="calendar" className="mt-4">
            <HostCalendarInline isAuthenticated={isAuthenticated} />
          </TabsContent>

          {/* Bookings tab */}
          <TabsContent value="bookings" className="mt-4 space-y-4">
            <div className="flex justify-end">
              <Link href="/host/bookings">
                <Button variant="outline" size="sm">
                  <CalendarDays className="w-4 h-4 mr-2" />
                  {t("hostDashboard.bookingDetailPage")}
                </Button>
              </Link>
            </div>
            {hostBookings && hostBookings.length > 0 ? (
              hostBookings.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{t("hostDashboard.bookingNo")} #{booking.id}</p>
                        <p className="text-sm text-muted-foreground">{new Date(booking.startTime).toLocaleString()}</p>
                        <p className="text-sm">{t("booking.adults")}: {booking.adultsCount} / {t("booking.children")}: {booking.childrenCount}</p>
                        <p className="text-sm font-semibold text-primary">¥{booking.amountJpy.toLocaleString()}</p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <Badge variant={booking.status === "pending" ? "secondary" : booking.status === "confirmed" ? "default" : "outline"}>
                          {booking.status}
                        </Badge>
                        {booking.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => confirmBooking.mutate({ id: booking.id })}
                              disabled={confirmBooking.isPending}
                            >
                              {t("hostDashboard.approve")}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => cancelBooking.mutate({ id: booking.id })}
                              disabled={cancelBooking.isPending}
                            >
                              {t("hostDashboard.reject")}
                            </Button>
                          </div>
                        )}
                        {booking.status === "confirmed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => completeBooking.mutate({ id: booking.id })}
                            disabled={completeBooking.isPending}
                          >
                            {t("hostDashboard.markComplete")}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{t("hostDashboard.noBookings")}</p>
              </div>
            )}
          </TabsContent>

          {/* Experiences tab */}
          <TabsContent value="experiences" className="mt-4 space-y-4">
            {showNewExp && (
              <Card className="border-primary/30">
                <CardHeader>
                  <CardTitle className="text-base">{t("experience.create")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t("hostDashboard.titleEnLabel")} *</Label>
                      <Input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} placeholder="Traditional Japanese Cooking" />
                    </div>
                    <div>
                      <Label>{t("hostDashboard.titleJaLabel")}</Label>
                       <Input value={titleJa} onChange={(e) => setTitleJa(e.target.value)} placeholder={t("hostDashboard.titleJaLabel")} />
                    </div>
                  </div>
                  <div>
                    <Label>{t("hostDashboard.descEnLabel")} *</Label>
                    <Textarea value={descEn} onChange={(e) => setDescEn(e.target.value)} rows={3} />
                  </div>
                  <div>
                    <Label>{t("hostDashboard.descJaLabel")}</Label>
                    <Textarea value={descJa} onChange={(e) => setDescJa(e.target.value)} rows={3} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label>{t("hostDashboard.priceLabel")} *</Label>
                      <Input type="number" min={1000} value={priceJpy} onChange={(e) => setPriceJpy(Number(e.target.value))} />
                    </div>
                    <div>
                      <Label>{t("hostDashboard.durationLabel")} *</Label>
                      <Input type="number" min={60} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
                    </div>
                    <div>
                      <Label>{t("hostDashboard.maxGuestsLabel")} *</Label>
                      <Input type="number" min={1} max={20} value={maxGuests} onChange={(e) => setMaxGuests(Number(e.target.value))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t("hostDashboard.cuisineTypeLabel")}</Label>
                      <Input value={cuisineType} onChange={(e) => setCuisineType(e.target.value)} placeholder="japanese, vegetarian..." />
                    </div>
                    <div>
                      <Label>{t("hostDashboard.expTypeLabel")}</Label>
                      <Select value={expType} onValueChange={(v) => setExpType(v as "cooking" | "culture" | "both")}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cooking">{t("hostDashboard.expTypeCooking")}</SelectItem>
                          <SelectItem value="culture">{t("hostDashboard.expTypeCulture")}</SelectItem>
                          <SelectItem value="both">{t("hostDashboard.expTypeBoth")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => createExp.mutate({ titleEn, titleJa, descriptionEn: descEn, descriptionJa: descJa, priceJpy, durationMinutes: duration, maxGuests, cuisineType, experienceType: expType })}
                      disabled={createExp.isPending || !titleEn || !descEn}
                    >
                      {createExp.isPending ? t("common.loading") : t("hostDashboard.create")}
                    </Button>
                    <Button variant="outline" onClick={() => setShowNewExp(false)}>{t("common.cancel")}</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {myExperiences && myExperiences.length > 0 ? (
              myExperiences.map((exp: { id: number; titleEn: string; titleJa: string | null; priceJpy: number; durationMinutes: number; maxGuests: number; approvalStatus: string; isActive: boolean }) => (
                <Card key={exp.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{exp.titleEn}</p>
                      {exp.titleJa && <p className="text-sm text-muted-foreground">{exp.titleJa}</p>}
                      <p className="text-sm">¥{exp.priceJpy.toLocaleString()} / {t("common.person")} · {exp.durationMinutes}{t("common.minutes")} · {t("hostDashboard.maxLabel")}{exp.maxGuests}{t("common.people")}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={exp.approvalStatus === "approved" ? "default" : exp.approvalStatus === "pending" ? "secondary" : "destructive"}>
                        {exp.approvalStatus}
                      </Badge>
                      <Badge variant={exp.isActive ? "outline" : "secondary"}>
                        {exp.isActive ? t("hostDashboard.published") : t("hostDashboard.unpublished")}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{t("hostDashboard.noExperiences")}</p>
                {myHost.approvalStatus === "approved" && (
                  <Button className="mt-3" onClick={() => setShowNewExp(true)}>
                    <Plus className="w-4 h-4 mr-2" />{t("hostDashboard.createFirstExperience")}
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          {/* Reviews tab */}
          <TabsContent value="reviews" className="mt-4 space-y-4">
            {!myHostReviews || myHostReviews.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">{t("review.noReviews")}</p>
                </CardContent>
              </Card>
            ) : (
              myHostReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  isHost={true}
                  onReplySuccess={refetchHostReviews}
                />
              ))
            )}
          </TabsContent>

          {/* Payout tab */}
          <TabsContent value="payout" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("hostDashboard.revenueReport")}</CardTitle>
              </CardHeader>
              <CardContent>
                {payoutSummary ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">{t("hostDashboard.monthlyRevenue")}</span>
                      <span className="font-semibold text-primary">¥{payoutSummary.currentMonthJpy.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">{t("hostDashboard.totalRevenue")}</span>
                      <span className="font-semibold">¥{payoutSummary.totalJpy.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">{t("hostDashboard.pendingBalance")}</span>
                      <span className="font-semibold text-amber-600">¥{payoutSummary.pendingJpy.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground pt-2">
                      {t("hostDashboard.payoutNote")}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">{t("common.noData")}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}

// ─── HostCalendarInline ─────────────────────────────────────────────────────
type CalSlot = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  maxGuests: number;
  status: "available" | "booked" | "blocked";
  note: string | null;
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function formatDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function HostCalendarInline({ isAuthenticated }: { isAuthenticated: boolean }) {
  const { t } = useTranslation();
  const MONTH_NAMES = t("calendar.monthNames").split(",");
  const DAY_NAMES = t("calendar.dayNames").split(",");
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [newStartTime, setNewStartTime] = useState("10:00");
  const [newEndTime, setNewEndTime] = useState("14:00");
  const [newMaxGuests, setNewMaxGuests] = useState("6");
  const [newNote, setNewNote] = useState("");
  const [bulkStartDate, setBulkStartDate] = useState("");
  const [bulkEndDate, setBulkEndDate] = useState("");
  const [bulkDays, setBulkDays] = useState<number[]>([0,1,2,3,4,5,6]);
  const [bulkStartTime, setBulkStartTime] = useState("10:00");
  const [bulkEndTime, setBulkEndTime] = useState("14:00");
  const [bulkMaxGuests, setBulkMaxGuests] = useState("6");

  const fromDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = getDaysInMonth(year, month);
  const toDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const { data: slots, refetch } = trpc.availability.getMySlots.useQuery(
    { fromDate, toDate },
    { enabled: isAuthenticated }
  );

  const addSlot = trpc.availability.addSlot.useMutation({
    onSuccess: () => { toast.success(t("calendar.addSlot")); setShowAddDialog(false); setNewNote(""); refetch(); },
    onError: (err) => toast.error(err.message),
  });
  const addBulkSlots = trpc.availability.addBulkSlots.useMutation({
    onSuccess: (data) => { toast.success(`${data.created} ${t("calendar.addSlot")}`); setShowBulkDialog(false); refetch(); },
    onError: (err) => toast.error(err.message),
  });
  const updateSlot = trpc.availability.updateSlot.useMutation({
    onSuccess: () => { toast.success(t("common.saved")); refetch(); },
    onError: (err) => toast.error(err.message),
  });
  const deleteSlot = trpc.availability.deleteSlot.useMutation({
    onSuccess: () => { toast.success(t("common.deleted")); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const slotsByDate = useMemo(() => {
    const map: Record<string, CalSlot[]> = {};
    if (!slots) return map;
    for (const s of slots) {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s as CalSlot);
    }
    return map;
  }, [slots]);

  const selectedSlots = selectedDate ? (slotsByDate[selectedDate] ?? []) : [];
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const todayStr = today.toISOString().slice(0, 10);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const setNextNMonths = (n: number) => {
    const start = new Date(); start.setDate(start.getDate() + 1);
    const end = new Date(); end.setMonth(end.getMonth() + n);
    setBulkStartDate(start.toISOString().slice(0, 10));
    setBulkEndDate(end.toISOString().slice(0, 10));
  };

  const handleBulkAdd = () => {
    if (!bulkStartDate || !bulkEndDate) { toast.error(t("calendar.startDate") + " / " + t("calendar.endDate")); return; }
    const slotsToAdd: Array<{ date: string; startTime: string; endTime: string; maxGuests: number }> = [];
    const cur = new Date(bulkStartDate);
    const end = new Date(bulkEndDate);
    while (cur <= end && slotsToAdd.length < 60) {
      if (bulkDays.includes(cur.getDay())) {
        slotsToAdd.push({ date: cur.toISOString().slice(0, 10), startTime: bulkStartTime, endTime: bulkEndTime, maxGuests: parseInt(bulkMaxGuests) });
      }
      cur.setDate(cur.getDate() + 1);
    }
    if (slotsToAdd.length === 0) { toast.error(t("calendar.targetDays")); return; }
    addBulkSlots.mutate({ slots: slotsToAdd });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t("calendar.calendarManageDesc")}</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowBulkDialog(true)}>
            <Plus className="w-4 h-4 mr-1" />{t("calendar.bulkRegister")}
          </Button>
          <Link href="/host/calendar">
            <Button size="sm" variant="ghost">{t("calendar.detailPage")}</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
                <CardTitle className="text-base">{year} {MONTH_NAMES[month]}</CardTitle>
                <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 mb-1">
                {DAY_NAMES.map((d, i) => (
                  <div key={d} className={`text-center text-xs font-medium py-1 ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-muted-foreground"}`}>{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = formatDateStr(year, month, day);
                  const daySlots = slotsByDate[dateStr] ?? [];
                  const hasAvailable = daySlots.some(s => s.status === "available");
                  const hasBooked = daySlots.some(s => s.status === "booked");
                  const hasBlocked = daySlots.some(s => s.status === "blocked");
                  const isSelected = selectedDate === dateStr;
                  const isToday = dateStr === todayStr;
                  const dow = new Date(year, month, day).getDay();
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`relative aspect-square rounded-lg p-1 text-sm transition-colors ${isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"} ${isToday && !isSelected ? "ring-2 ring-primary ring-offset-1" : ""} ${dow === 0 && !isSelected ? "text-red-500" : ""} ${dow === 6 && !isSelected ? "text-blue-500" : ""}`}
                    >
                      <span className="block text-center">{day}</span>
                      {daySlots.length > 0 && (
                        <div className="flex justify-center gap-0.5 mt-0.5">
                          {hasAvailable && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                          {hasBooked && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                          {hasBlocked && <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />{t("calendar.available")}</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />{t("calendar.booked")}</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400" />{t("calendar.blocked")}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected date panel */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-sm">
                {selectedDate ? `${selectedDate.replace(/-/g, "/")} ${t("calendar.slotOf")}` : t("calendar.selectDate")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDate ? (
                <>
                  {selectedSlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-3">{t("calendar.noSlotsForDay")}</p>
                  ) : (
                    <div className="space-y-2 mb-3">
                      {selectedSlots.map((slot) => (
                        <div key={slot.id} className="flex items-center justify-between p-2 rounded-lg border">
                          <div>
                            <div className="flex items-center gap-1 text-xs font-medium">
                              <Clock className="w-3 h-3" />{slot.startTime} - {slot.endTime}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <Users className="w-3 h-3" />{t("calendar.maxCapacity")} {slot.maxGuests}
                              <Badge variant={slot.status === "available" ? "default" : slot.status === "booked" ? "secondary" : "outline"} className="text-xs py-0 ml-1">
                                {slot.status === "available" ? t("calendar.available") : slot.status === "booked" ? t("calendar.booked") : t("calendar.blocked")}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {slot.status === "available" && (
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateSlot.mutate({ id: slot.id, status: "blocked" })} title={t("calendar.blocked")}>
                                <span className="text-xs">🚫</span>
                              </Button>
                            )}
                            {slot.status === "blocked" && (
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateSlot.mutate({ id: slot.id, status: "available" })} title={t("calendar.available")}>
                                <span className="text-xs">✅</span>
                              </Button>
                            )}
                            {slot.status !== "booked" && (
                              <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => deleteSlot.mutate({ id: slot.id })}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button className="w-full" size="sm" onClick={() => setShowAddDialog(true)}>
                    <Plus className="w-4 h-4 mr-1" />{t("calendar.addSlotForDay")}
                  </Button>
                </>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">{t("calendar.selectDatePrompt")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Slot Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAddDialog(false)}>
          <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-4">{selectedDate?.replace(/-/g, "/")} {t("calendar.addSlotForDay")}</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{t("calendar.startTime")}</Label>
                  <Input type="time" value={newStartTime} onChange={e => setNewStartTime(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">{t("calendar.endTime")}</Label>
                  <Input type="time" value={newEndTime} onChange={e => setNewEndTime(e.target.value)} />
                </div>
              </div>
              <div>
                <Label className="text-xs">{t("calendar.maxCapacity")}</Label>
                <Select value={newMaxGuests} onValueChange={setNewMaxGuests}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{[1,2,3,4,5,6,8,10,12].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">{t("calendar.memo")}</Label>
                <Input placeholder={t("calendar.memoPlaceholder")} value={newNote} onChange={e => setNewNote(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddDialog(false)}>{t("common.cancel")}</Button>
              <Button className="flex-1" onClick={() => {
                if (!selectedDate) return;
                addSlot.mutate({ date: selectedDate, startTime: newStartTime, endTime: newEndTime, maxGuests: parseInt(newMaxGuests), note: newNote || undefined });
              }} disabled={addSlot.isPending}>
                {addSlot.isPending ? t("calendar.adding") : t("calendar.addSlot")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Add Dialog */}
      {showBulkDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowBulkDialog(false)}>
          <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-4">{t("calendar.bulkRegisterTitle")}</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">{t("calendar.quickPeriod")}</Label>
                <div className="flex gap-2 flex-wrap mt-1">
                  {[{labelKey:"calendar.untilEndOfMonth",months:0},{labelKey:"calendar.oneMonth",months:1},{labelKey:"calendar.twoMonths",months:2},{labelKey:"calendar.threeMonths",months:3}].map(({labelKey,months}) => (
                    <button key={labelKey} type="button" onClick={() => setNextNMonths(months)} className="px-3 py-1 text-xs rounded-full border border-border hover:bg-muted transition-colors">{t(labelKey)}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">{t("calendar.startDate")}</Label><Input type="date" value={bulkStartDate} onChange={e => setBulkStartDate(e.target.value)} min={today.toISOString().slice(0,10)} /></div>
                <div><Label className="text-xs">{t("calendar.endDate")}</Label><Input type="date" value={bulkEndDate} onChange={e => setBulkEndDate(e.target.value)} min={bulkStartDate || today.toISOString().slice(0,10)} /></div>
              </div>
              <div>
                <Label className="text-xs">{t("calendar.targetDays")}</Label>
                <div className="flex gap-2 flex-wrap mt-1">
                  {DAY_NAMES.map((d, i) => (
                    <button key={i} onClick={() => setBulkDays(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])} className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${bulkDays.includes(i) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{d}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">{t("calendar.startTime")}</Label><Input type="time" value={bulkStartTime} onChange={e => setBulkStartTime(e.target.value)} /></div>
                <div><Label className="text-xs">{t("calendar.endTime")}</Label><Input type="time" value={bulkEndTime} onChange={e => setBulkEndTime(e.target.value)} /></div>
              </div>
              <div>
                <Label className="text-xs">{t("calendar.maxCapacity")}</Label>
                <Select value={bulkMaxGuests} onValueChange={setBulkMaxGuests}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{[1,2,3,4,5,6,8,10,12].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowBulkDialog(false)}>{t("common.cancel")}</Button>
              <Button className="flex-1" onClick={handleBulkAdd} disabled={addBulkSlots.isPending}>
                {addBulkSlots.isPending ? t("calendar.registering") : t("calendar.bulkRegisterBtn")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
