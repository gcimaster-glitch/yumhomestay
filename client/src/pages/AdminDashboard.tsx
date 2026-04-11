import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { BookOpen, Calendar, ChefHat, ClipboardList, DollarSign, ExternalLink, MapPin, MessageCircle, Phone, School, Shield, Users, UserPlus, Download, Reply, Trash2, StickyNote, AlertTriangle, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { TrendBadge } from "@/components/TrendBadge";
import { BookingChat } from "@/components/BookingChat";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";

type CookingSchoolWithOwner = {
  id: number;
  nameJa: string;
  nameEn: string | null;
  prefecture: string | null;
  city: string | null;
  cuisineSpecialty: string | null;
  maxStudents: number | null;
  pricePerPersonJpy: number | null;
  approvalStatus: string;
  isActive: boolean;
  createdAt: Date;
  websiteUrl: string | null;
  phoneNumber: string | null;
  contactEmail: string | null;
  businessLicenseNumber: string | null;
  descriptionJa: string | null;
  descriptionEn: string | null;
  languages: string | null;
  certifications: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
};

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  // Cooking school review state
  const [selectedSchool, setSelectedSchool] = useState<CookingSchoolWithOwner | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [csStatusFilter, setCsStatusFilter] = useState<"all" | "pending" | "approved" | "rejected" | "suspended">("pending");

  // Inquiry management state
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState<"all" | "submitted" | "reviewing" | "host_contacted" | "confirmed" | "payment_sent" | "payment_received" | "completed" | "rejected">("submitted");
  const [selectedInquiryId, setSelectedInquiryId] = useState<number | null>(null);
  const [inquiryRejectReason, setInquiryRejectReason] = useState("");
  const [showInquiryRejectDialog, setShowInquiryRejectDialog] = useState(false);
  const [paymentLinkUrl, setPaymentLinkUrl] = useState("");
  const [showPaymentLinkDialog, setShowPaymentLinkDialog] = useState(false);
  // Host contact dialog state
  const [showHostContactDialog, setShowHostContactDialog] = useState(false);
  const [contactInquiryId, setContactInquiryId] = useState<number | null>(null);
  // Chat management state
  const [adminChatInquiryId, setAdminChatInquiryId] = useState<number | null>(null);
  const [contactSelectedHostId, setContactSelectedHostId] = useState<string>("");
  const [contactStaffNotes, setContactStaffNotes] = useState("");
  // Video call dialog state
  const [showVideoCallDialog, setShowVideoCallDialog] = useState(false);
  const [videoCallInquiryId, setVideoCallInquiryId] = useState<number | null>(null);
  const [videoCallScheduledAt, setVideoCallScheduledAt] = useState("");
  const [videoCallMeetingUrl, setVideoCallMeetingUrl] = useState("");
  const [videoCallNotes, setVideoCallNotes] = useState("");

  // Host review state (must be declared before queries)
  const [hostStatusFilter, setHostStatusFilter] = useState<"all" | "pending" | "interview" | "approved" | "rejected">("pending");
  const [showHostRejectDialog, setShowHostRejectDialog] = useState(false);
  const [selectedHostId, setSelectedHostId] = useState<number | null>(null);
  const [hostRejectReason, setHostRejectReason] = useState("");
  const [showInterviewDialog, setShowInterviewDialog] = useState(false);
  const [interviewScheduledAt, setInterviewScheduledAt] = useState("");
  // Lead management state
  const [leadTypeFilter, setLeadTypeFilter] = useState<"all" | "host" | "cooking_school" | "agent">("all");
  const [leadStatusFilter, setLeadStatusFilter] = useState<"all" | "new" | "contacted" | "qualified" | "converted" | "rejected">("all");
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [leadNotes, setLeadNotes] = useState("");
  const [leadReplyMessage, setLeadReplyMessage] = useState("");
  const [showLeadNotesDialog, setShowLeadNotesDialog] = useState(false);
  const [showLeadReplyDialog, setShowLeadReplyDialog] = useState(false);
  const [showLeadDeleteDialog, setShowLeadDeleteDialog] = useState(false);

  // Availability calendar state
  const [availHostId, setAvailHostId] = useState<number | null>(null);
  const [availMonth, setAvailMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const { data: stats } = trpc.admin.getStats.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  // Availability calendar queries
  const { data: approvedHostsForCalendar } = trpc.admin.listApprovedHosts.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const availFromDate = availMonth ? `${availMonth}-01` : "";
  const availToDate = availMonth
    ? (() => { const [y, m] = availMonth.split("-"); return `${y}-${m}-${new Date(parseInt(y), parseInt(m), 0).getDate()}`; })()
    : "";
  const { data: availSlots } = trpc.admin.getHostAvailability.useQuery(
    { hostId: availHostId ?? 0, fromDate: availFromDate, toDate: availToDate },
    { enabled: isAuthenticated && user?.role === "admin" && availHostId !== null && !!availFromDate }
  );
  const { data: hosts, refetch: refetchHosts } = trpc.host.adminList.useQuery(
    { status: hostStatusFilter },
    { enabled: isAuthenticated && user?.role === "admin" }
  );
  const { data: experiences, refetch: refetchExperiences } = trpc.admin.listExperiences.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: users } = trpc.admin.listUsers.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: auditLogs } = trpc.admin.getAuditLogs.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: cookingSchools, refetch: refetchCookingSchools } = trpc.admin.listCookingSchools.useQuery(
    { status: csStatusFilter },
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const approveHost = trpc.host.adminApprove.useMutation({
    onSuccess: () => { toast.success(t("admin.hostApproved")); refetchHosts(); },
    onError: (err: { message: string }) => toast.error(err.message),
  });
  const rejectHost = trpc.host.adminReject.useMutation({
    onSuccess: () => {
      toast.success(t("admin.hostRejected"));
      setShowHostRejectDialog(false);
      setSelectedHostId(null);
      setHostRejectReason("");
      refetchHosts();
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });
  const setInterviewHost = trpc.host.adminSetInterview.useMutation({
    onSuccess: () => {
      toast.success(t("admin.interviewSet"));
      setShowInterviewDialog(false);
      setSelectedHostId(null);
      setInterviewScheduledAt("");
      refetchHosts();
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });
  // Approved hosts for inquiry matching
  const { data: approvedHosts } = trpc.host.adminApprovedList.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });

  // Inquiry queries & mutations
  const { data: inquiries, refetch: refetchInquiries } = trpc.inquiry.adminList.useQuery(
    { status: inquiryStatusFilter === "all" ? undefined : inquiryStatusFilter },
    { enabled: isAuthenticated && user?.role === "admin" }
  );
  // Chat: all inquiries that have active chat (confirmed/payment_sent/payment_received)
  const { data: chatableInquiries } = trpc.inquiry.adminList.useQuery(
    { status: undefined },
    { enabled: isAuthenticated && user?.role === "admin" }
  );
  const activeChatInquiries = chatableInquiries?.filter((i) =>
    ["confirmed", "payment_sent", "payment_received"].includes(i.status)
  ) ?? [];
  // Pending inquiries count for badge (submitted + reviewing = needs attention)
  const pendingInquiryCount = chatableInquiries?.filter((i) =>
    ["submitted", "reviewing"].includes(i.status)
  ).length ?? 0;
  const startReview = trpc.inquiry.adminStartReview.useMutation({
    onSuccess: () => { toast.success(t("admin.inquiryReviewing")); refetchInquiries(); },
    onError: (err: { message: string }) => toast.error(err.message),
  });
  const contactHost = trpc.inquiry.adminContactHost.useMutation({
    onSuccess: () => {
      toast.success(t("admin.hostContacted"));
      setShowHostContactDialog(false);
      setContactInquiryId(null);
      setContactSelectedHostId("");
      setContactStaffNotes("");
      refetchInquiries();
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });
  const confirmInquiry = trpc.inquiry.adminConfirm.useMutation({
    onSuccess: () => { toast.success(t("admin.inquiryConfirmed")); refetchInquiries(); },
    onError: (err: { message: string }) => toast.error(err.message),
  });
  const confirmPayment = trpc.inquiry.adminConfirmPayment.useMutation({
    onSuccess: () => { toast.success(t("admin.paymentConfirmed")); refetchInquiries(); },
    onError: (err: { message: string }) => toast.error(err.message),
  });
  const completeInquiry = trpc.inquiry.adminComplete.useMutation({
    onSuccess: () => { toast.success(t("admin.inquiryCompleted")); refetchInquiries(); },
    onError: (err: { message: string }) => toast.error(err.message),
  });
  const rejectInquiry = trpc.inquiry.adminReject.useMutation({
    onSuccess: () => {
      toast.success(t("admin.inquiryRejected"));
      setShowInquiryRejectDialog(false);
      setSelectedInquiryId(null);
      setInquiryRejectReason("");
      refetchInquiries();
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });
  const sendPaymentLink = trpc.inquiry.adminSendPaymentLink.useMutation({
    onSuccess: () => {
      toast.success(t("admin.paymentLinkSent"));
      setShowPaymentLinkDialog(false);
      setSelectedInquiryId(null);
      setPaymentLinkUrl("");
      refetchInquiries();
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  const setVideoCall = trpc.inquiry.adminSetVideoCall.useMutation({
    onSuccess: () => {
      toast.success(t("admin.videoCallSet"));
      setShowVideoCallDialog(false);
      setVideoCallInquiryId(null);
      setVideoCallScheduledAt("");
      setVideoCallMeetingUrl("");
      setVideoCallNotes("");
      refetchInquiries();
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });
  // Lead management queries & mutations
  const { data: leads, refetch: refetchLeads } = trpc.lead.adminList.useQuery(
    {
      type: leadTypeFilter === "all" ? undefined : leadTypeFilter,
      status: leadStatusFilter === "all" ? undefined : leadStatusFilter,
    },
    { enabled: isAuthenticated && user?.role === "admin" }
  );
  const updateLead = trpc.lead.adminUpdate.useMutation({
    onSuccess: () => { toast.success("リードを更新しました"); setShowLeadNotesDialog(false); refetchLeads(); },
    onError: (err: { message: string }) => toast.error(err.message),
  });
  const replyLead = trpc.lead.adminReply.useMutation({
    onSuccess: () => { toast.success("返信メールを送信しました"); setShowLeadReplyDialog(false); setLeadReplyMessage(""); refetchLeads(); },
    onError: (err: { message: string }) => toast.error(err.message),
  });
  const deleteLead = trpc.lead.adminDelete.useMutation({
    onSuccess: () => { toast.success("リードを削除しました"); setShowLeadDeleteDialog(false); setSelectedLeadId(null); refetchLeads(); },
    onError: (err: { message: string }) => toast.error(err.message),
  });
  const exportLeadCsv = trpc.lead.adminExportCsv.useQuery(
    { type: leadTypeFilter === "all" ? undefined : leadTypeFilter, status: leadStatusFilter === "all" ? undefined : leadStatusFilter },
    { enabled: false }
  );

  const approveExp = trpc.admin.approveExperience.useMutation({
    onSuccess: () => { toast.success(t("admin.expApproved")); refetchExperiences(); },
    onError: (err: { message: string }) => toast.error(err.message),
  });
  const rejectExp = trpc.admin.rejectExperience.useMutation({
    onSuccess: () => { toast.success(t("admin.expRejected")); refetchExperiences(); },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  const approveCS = trpc.admin.approveCookingSchool.useMutation({
    onSuccess: () => {
      toast.success(t("admin.csApproved"));
      setSelectedSchool(null);
      refetchCookingSchools();
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });
  const rejectCS = trpc.admin.rejectCookingSchool.useMutation({
    onSuccess: () => {
      toast.success(t("admin.csRejected"));
      setShowRejectDialog(false);
      setSelectedSchool(null);
      setRejectReason("");
      refetchCookingSchools();
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });
  const suspendCS = trpc.admin.suspendCookingSchool.useMutation({
    onSuccess: () => {
      toast.success(t("admin.csSuspended"));
      setShowSuspendDialog(false);
      setSelectedSchool(null);
      setSuspendReason("");
      refetchCookingSchools();
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  const statusBadge = (status: string) => {
    const map: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      approved: "default",
      pending: "secondary",
      interview: "outline",
      rejected: "destructive",
      suspended: "destructive",
    };
    const labelMap: Record<string, string> = {
      approved: t("admin.statusApproved"),
      pending: t("admin.statusPending"),
      interview: t("admin.statusInterview"),
      rejected: t("admin.statusRejected"),
      suspended: t("admin.statusSuspended"),
    };
    return <Badge variant={map[status] ?? "outline"}>{labelMap[status] ?? status}</Badge>;
  };

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

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Shield className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">{t("admin.noPermission")}</p>
            <Button className="mt-4" onClick={() => navigate("/")}>{t("common.backToHome")}</Button>
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
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">{t("admin.dashboard")}</h1>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {([
              {
                icon: <Users className="w-5 h-5 text-primary" />,
                label: t("admin.totalUsers"),
                value: stats.totalUsers,
                trend: { current: stats.currentMonthUsers, previous: stats.lastMonthUsers },
              },
              {
                icon: <ChefHat className="w-5 h-5 text-primary" />,
                label: t("admin.totalHosts"),
                value: stats.totalHosts,
                trend: null,
              },
              {
                icon: <BookOpen className="w-5 h-5 text-primary" />,
                label: t("admin.pendingHosts"),
                value: stats.pendingHosts,
                trend: null,
              },
              {
                icon: <DollarSign className="w-5 h-5 text-primary" />,
                label: t("admin.totalBookings"),
                value: stats.totalBookings,
                trend: { current: stats.currentMonthRevenueJpy, previous: stats.lastMonthRevenueJpy },
              },
            ] as Array<{ icon: React.ReactNode; label: string; value: number; trend: { current: number; previous: number } | null }>).map((stat, i) => (
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
        )}

        <Tabs defaultValue="inquiries">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="cooking-schools" className="flex items-center gap-1">
              <School className="w-3.5 h-3.5" />
              {t("admin.cookingSchoolReview")}
              {cookingSchools && csStatusFilter === "pending" && cookingSchools.length > 0 && (
                <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 leading-none">
                  {cookingSchools.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="hosts">{t("admin.hostReview")}</TabsTrigger>
            <TabsTrigger value="inquiries" className="flex items-center gap-1">
              <ClipboardList className="w-3.5 h-3.5" />
              {t("admin.inquiryManagement")}
              {pendingInquiryCount > 0 && (
                <span className="ml-1 bg-destructive text-destructive-foreground text-xs rounded-full px-1.5 py-0.5 leading-none">
                  {pendingInquiryCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="experiences">{t("admin.experienceReview")}</TabsTrigger>
            <TabsTrigger value="users">{t("admin.userManagement")}</TabsTrigger>
            <TabsTrigger value="audit">{t("admin.auditLog")}</TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" />
              {t("admin.chatManagement")}
              {activeChatInquiries.length > 0 && (
                <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 leading-none">
                  {activeChatInquiries.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="availability" className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {t("admin.hostAvailability")}
            </TabsTrigger>
            <TabsTrigger value="leads" className="flex items-center gap-1">
              <UserPlus className="w-3.5 h-3.5" />
              リード管理
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" />
              お問い合わせ
            </TabsTrigger>
            <TabsTrigger value="kyc" className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              KYC審査
            </TabsTrigger>
            <TabsTrigger value="error-monitor" className="flex items-center gap-1 text-destructive data-[state=active]:text-destructive">
              <AlertTriangle className="w-3.5 h-3.5" />
              エラー監視
            </TabsTrigger>
          </TabsList>

          {/* ─── Cooking Schools tab ─────────────────────────────────────────── */}
          <TabsContent value="cooking-schools" className="mt-4">
            {/* Status filter */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {(["pending", "all", "approved", "rejected", "suspended"] as const).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={csStatusFilter === s ? "default" : "outline"}
                  onClick={() => setCsStatusFilter(s)}
                >
                  {s === "all" ? t("admin.all") : s === "pending" ? t("admin.statusPending") : s === "approved" ? t("admin.statusApproved") : s === "rejected" ? t("admin.statusRejected") : t("admin.statusSuspended")}
                </Button>
              ))}
            </div>

            <div className="space-y-3">
              {cookingSchools && cookingSchools.length > 0 ? (
                cookingSchools.map((school) => (
                  <Card key={school.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-semibold text-base">{school.nameJa}</p>
                            {school.nameEn && <p className="text-sm text-muted-foreground">{school.nameEn}</p>}
                            {statusBadge(school.approvalStatus)}
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                            {(school.prefecture || school.city) && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {school.prefecture} {school.city}
                              </span>
                            )}
                            {school.cuisineSpecialty && (
                              <span className="flex items-center gap-1">
                                <ChefHat className="w-3 h-3" />
                                {school.cuisineSpecialty}
                              </span>
                            )}
                            {school.ownerName && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {school.ownerName}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {t("admin.appliedAt")}: {new Date(school.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedSchool(school as CookingSchoolWithOwner)}
                          >
                            {t("admin.viewDetail")}
                          </Button>
                          {school.approvalStatus === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => approveCS.mutate({ id: school.id })}
                              disabled={approveCS.isPending}
                            >
                          {t("admin.approve")}
                          </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <School className="w-12 h-12 mx-auto mb-3 opacity-30" />                  <p>{csStatusFilter === "pending" ? t("admin.noPendingCS") : t("admin.noCS")}</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Hosts tab */}
          <TabsContent value="hosts" className="mt-4">
            {/* Status filter */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {(["pending", "interview", "all", "approved", "rejected"] as const).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={hostStatusFilter === s ? "default" : "outline"}
                  onClick={() => setHostStatusFilter(s)}
                >
                  {s === "all" ? t("admin.all") : s === "pending" ? t("admin.statusPending") : s === "interview" ? t("admin.statusInterview") : s === "approved" ? t("admin.statusApproved") : t("admin.statusRejected")}
                </Button>
              ))}
            </div>
            <div className="space-y-3">
              {hosts && hosts.length > 0 ? (
                hosts.map((host) => (
                  <Card key={host.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-semibold">{t("admin.hostId")} #{host.id}</p>
                            {statusBadge(host.approvalStatus)}
                            {host.registrationFeePaid ? (
                              <Badge variant="default" className="bg-green-600">{t("admin.regFeePaid")}</Badge>
                            ) : (
                              <Badge variant="outline" className="text-amber-600 border-amber-400">{t("admin.regFeeUnpaid")}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {host.prefecture} {host.city} · {host.nearestStation}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{host.bioEn}</p>
                          {host.certificationDetails && (
                            <p className="text-xs text-muted-foreground mt-1 bg-muted/50 px-2 py-1 rounded">
                              {host.certificationDetails}
                            </p>
                          )}
                          <div className="flex gap-2 mt-2">
                            <Badge variant={host.kycStatus === "verified" ? "default" : "secondary"}>
                              KYC: {host.kycStatus}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          {(host.approvalStatus === "pending" || host.approvalStatus === "interview") && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => approveHost.mutate({ hostId: host.id })}
                                disabled={approveHost.isPending}
                              >
                                {t("admin.approveAndCert")}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { setSelectedHostId(host.id); setShowInterviewDialog(true); }}
                                disabled={setInterviewHost.isPending}
                              >
                                {t("admin.zoomInterview")}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => { setSelectedHostId(host.id); setShowHostRejectDialog(true); }}
                              >
                              {t("admin.reject")}
                            </Button>
                            </>
                          )}
                          {host.approvalStatus === "approved" && (
                            <Badge variant="default" className="text-center">{t("admin.certified")}</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>{hostStatusFilter === "pending" ? t("admin.noPendingHosts") : t("admin.noHosts")}</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ─── Inquiries tab ─────────────────────────────────────────────── */}
          <TabsContent value="inquiries" className="mt-4">
            {/* Status filter */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {(["submitted", "reviewing", "host_contacted", "confirmed", "payment_sent", "payment_received", "completed", "rejected", "all"] as const).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={inquiryStatusFilter === s ? "default" : "outline"}
                  onClick={() => setInquiryStatusFilter(s)}
                >
                  {s === "submitted" ? t("admin.statusSubmitted") :
                   s === "reviewing" ? t("admin.statusReviewing") :
                   s === "host_contacted" ? t("admin.statusHostContacted") :
                   s === "confirmed" ? t("admin.statusConfirmed") :
                   s === "payment_sent" ? t("admin.statusPaymentSent") :
                   s === "payment_received" ? t("admin.statusPaymentReceived") :
                   s === "completed" ? t("admin.statusCompleted") :
                   s === "rejected" ? t("admin.statusRejected") : t("admin.all")}
                </Button>
              ))}
            </div>

            <div className="space-y-3">
              {inquiries && inquiries.length > 0 ? (
                inquiries.map((inq) => (
                  <Card key={inq.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{t("admin.inquiryId")} #{inq.id}</span>
                            <Badge variant="outline" className="text-xs">{inq.status}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-0.5">
                            <p>{t("admin.guestId")}: {inq.userId}</p>
                            <p>{t("booking.adults")} {inq.adultsCount}{inq.childrenCount ? ` / ${t("booking.children")} ${inq.childrenCount}` : ""}</p>
                            {inq.preferredArea && <p>{t("apply.preferredArea")}: {inq.preferredArea}</p>}
                            {inq.preferredDateFrom && <p>{t("apply.preferredDate")}: {inq.preferredDateFrom}{inq.preferredDateTo ? ` ~ ${inq.preferredDateTo}` : ""}</p>}
                            {inq.originCountry && <p>{t("apply.originCountry")}: {inq.originCountry}</p>}
                            {inq.dietaryRestrictions && <p>{t("apply.dietaryRestrictions")}: {inq.dietaryRestrictions}</p>}
                            {inq.specialRequests && <p>{t("apply.specialRequests")}: {inq.specialRequests}</p>}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          {inq.status === "submitted" && (
                            <Button size="sm" variant="outline" onClick={() => startReview.mutate({ id: inq.id })} disabled={startReview.isPending}>
                              {t("admin.startReview")}
                            </Button>
                          )}
                          {inq.status === "reviewing" && (
                            <Button size="sm" variant="outline" onClick={() => { setContactInquiryId(inq.id); setContactSelectedHostId(""); setContactStaffNotes(""); setShowHostContactDialog(true); }}>
                              {t("admin.contactHost")}
                            </Button>
                          )}
                          {inq.status === "host_contacted" && (
                            <Button size="sm" onClick={() => confirmInquiry.mutate({ id: inq.id })} disabled={confirmInquiry.isPending}>
                              {t("admin.confirm")}
                            </Button>
                          )}
                          {inq.status === "confirmed" && (
                            <>
                              <Button size="sm" onClick={() => { setSelectedInquiryId(inq.id); setShowPaymentLinkDialog(true); }}>
                                {t("admin.sendPaymentLink")}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-purple-400 text-purple-700 hover:bg-purple-50"
                                onClick={() => {
                                  setVideoCallInquiryId(inq.id);
                                  setVideoCallScheduledAt((inq as { videoCallScheduledAt?: Date | null }).videoCallScheduledAt
                                    ? new Date((inq as { videoCallScheduledAt?: Date | null }).videoCallScheduledAt!).toISOString().slice(0, 16)
                                    : "");
                                  setVideoCallMeetingUrl((inq as { videoCallMeetingUrl?: string | null }).videoCallMeetingUrl ?? "");
                                  setVideoCallNotes((inq as { videoCallNotes?: string | null }).videoCallNotes ?? "");
                                  setShowVideoCallDialog(true);
                                }}
                              >
                                {t("admin.videoCallSetup")}
                              </Button>
                            </>
                          )}
                          {inq.status === "payment_sent" && (
                            <Button size="sm" variant="outline" onClick={() => confirmPayment.mutate({ id: inq.id })} disabled={confirmPayment.isPending}>
                              {t("admin.confirmPayment")}
                            </Button>
                          )}
                          {inq.status === "payment_received" && (
                            <Button size="sm" variant="outline" onClick={() => completeInquiry.mutate({ id: inq.id })} disabled={completeInquiry.isPending}>
                              {t("admin.complete")}
                            </Button>
                          )}
                          {!["rejected", "cancelled", "completed"].includes(inq.status) && (
                            <Button size="sm" variant="destructive" onClick={() => { setSelectedInquiryId(inq.id); setShowInquiryRejectDialog(true); }}>
                              {t("admin.reject")}
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        {t("admin.appliedAt")}: {new Date(inq.submittedAt).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>{t("admin.noInquiries")}</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Experiences tab */}
          <TabsContent value="experiences" className="mt-4 space-y-3">
            {experiences && experiences.length > 0 ? (
              experiences.map((exp) => (
                <Card key={exp.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{exp.titleEn}</p>
                        {exp.titleJa && <p className="text-sm text-muted-foreground">{exp.titleJa}</p>}
                        <p className="text-sm">¥{exp.priceJpy.toLocaleString()} / {t("common.person")} · {exp.durationMinutes}{t("common.minutes")} · {t("experience.maxGuests")}{exp.maxGuests}</p>
                        <Badge variant={exp.approvalStatus === "approved" ? "default" : exp.approvalStatus === "pending" ? "secondary" : "destructive"} className="mt-2">
                          {exp.approvalStatus}
                        </Badge>
                      </div>
                      {exp.approvalStatus === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => approveExp.mutate({ experienceId: exp.id })}
                            disabled={approveExp.isPending}
                          >
                              {t("admin.approve")}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => rejectExp.mutate({ experienceId: exp.id })}
                            disabled={rejectExp.isPending}
                          >
                              {t("admin.reject")}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{t("admin.noExperiences")}</p>
              </div>
            )}
          </TabsContent>

          {/* Users tab */}
          <TabsContent value="users" className="mt-4">
            <div className="space-y-3">
              {users && users.length > 0 ? (
                users.map((u) => (
                  <Card key={u.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{u.name ?? t("admin.noName")}</p>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge>
                          <Badge variant="outline">{u.userType}</Badge>
                          <Badge variant={u.identityStatus === "verified" ? "default" : "outline"}>
                            KYC: {u.identityStatus}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>{t("admin.noUsers")}</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Audit logs tab */}
          <TabsContent value="audit" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" />
                  {t("admin.auditLogTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {auditLogs && auditLogs.length > 0 ? (
                  <div className="space-y-2">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 text-sm border-b pb-2 last:border-0">
                        <div className="flex-1">
                          <span className="font-mono text-xs bg-muted px-1 rounded">{log.action}</span>
                          <span className="text-muted-foreground ml-2">{log.targetResource} {log.targetId ? `#${log.targetId}` : ""}</span>
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">{t("admin.noAuditLogs")}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Chat management tab ─────────────────────────────────────────────── */}
          <TabsContent value="chat" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[400px] md:h-[calc(100vh-280px)] md:max-h-[700px]">
              {/* Left: list of active chat threads */}
              <div className="md:col-span-1 border rounded-xl overflow-y-auto bg-card">
                <div className="p-3 border-b">
                  <p className="text-sm font-semibold">{t("admin.chatThreadList")}</p>
                  <p className="text-xs text-muted-foreground">{t("admin.chatThreadDesc")}</p>
                </div>
                {activeChatInquiries.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    {t("admin.noActiveChats")}
                  </div>
                ) : (
                  <div className="divide-y">
                    {activeChatInquiries.map((inq) => (
                      <button
                        key={inq.id}
                        onClick={() => setAdminChatInquiryId(inq.id)}
                        className={`w-full text-left p-3 hover:bg-muted/50 transition-colors ${
                          adminChatInquiryId === inq.id ? "bg-muted" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{t("admin.inquiryId")} #{inq.id}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">{inq.status}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {t("booking.adults")} {inq.adultsCount}
                          {inq.preferredArea ? ` ・ ${inq.preferredArea}` : ""}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: chat panel */}
              <div className="md:col-span-2 border rounded-xl overflow-hidden bg-card">
                {adminChatInquiryId ? (
                  <BookingChat
                    inquiryId={adminChatInquiryId}
                    onClose={() => setAdminChatInquiryId(null)}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center space-y-2">
                      <MessageCircle className="w-8 h-8 mx-auto opacity-30" />
                      <p className="text-sm">{t("admin.selectThread")}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
           </TabsContent>

          {/* ─── Host Availability Calendar tab ─────────────────────────────── */}
          <TabsContent value="availability" className="mt-4">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">{t("admin.selectHost")}</label>
                  <select
                    className="border rounded-md px-3 py-2 text-sm bg-background"
                    value={availHostId ?? ""}
                    onChange={(e) => setAvailHostId(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">{t("admin.selectHostPlaceholder")}</option>
                    {(approvedHostsForCalendar ?? []).map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.nearestStation ? `${h.prefecture ?? ""} / ${h.nearestStation}駅` : `${h.prefecture ?? ""} ${h.city ?? ""}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">{t("admin.selectMonth")}</label>
                  <input
                    type="month"
                    className="border rounded-md px-3 py-2 text-sm bg-background"
                    value={availMonth}
                    onChange={(e) => setAvailMonth(e.target.value)}
                  />
                </div>
              </div>

              {availHostId === null ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>{t("admin.selectHostToViewCalendar")}</p>
                </div>
              ) : !availSlots || availSlots.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>{t("admin.noAvailabilitySlots")}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{availSlots.length}{t("admin.slotsCount")}</p>
                  <div className="grid gap-2">
                    {availSlots.map((slot) => (
                      <div
                        key={slot.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          slot.status === "available" ? "border-green-200 bg-green-50 dark:bg-green-950/20" :
                          slot.status === "booked" ? "border-blue-200 bg-blue-50 dark:bg-blue-950/20" :
                          "border-gray-200 bg-gray-50 dark:bg-gray-900/20"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-medium">{slot.date}</div>
                          <div className="text-sm text-muted-foreground">{slot.startTime} – {slot.endTime}</div>
                          <div className="text-xs text-muted-foreground">{t("admin.maxGuests", { count: slot.maxGuests })}</div>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          slot.status === "available" ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" :
                          slot.status === "booked" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" :
                          "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        }`}>
                          {slot.status === "available" ? t("calendar.available") :
                           slot.status === "booked" ? t("calendar.booked") :
                           t("calendar.blocked")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ─── Leads tab ─────────────────────────────────────────────────── */}
          <TabsContent value="leads" className="mt-4">
            {/* Filters + CSV */}
            <div className="flex flex-wrap gap-2 mb-4 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <Select value={leadTypeFilter} onValueChange={(v) => setLeadTypeFilter(v as typeof leadTypeFilter)}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="種別" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全種別</SelectItem>
                    <SelectItem value="host">ホストファミリー</SelectItem>
                    <SelectItem value="cooking_school">料理教室</SelectItem>
                    <SelectItem value="agent">旅行代理店</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={leadStatusFilter} onValueChange={(v) => setLeadStatusFilter(v as typeof leadStatusFilter)}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="ステータス" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全ステータス</SelectItem>
                    <SelectItem value="new">新規</SelectItem>
                    <SelectItem value="contacted">連絡済み</SelectItem>
                    <SelectItem value="qualified">有望</SelectItem>
                    <SelectItem value="converted">成約</SelectItem>
                    <SelectItem value="rejected">不採用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={async () => {
                  const result = await exportLeadCsv.refetch();
                  if (result.data?.csv) {
                    const blob = new Blob([result.data.csv], { type: "text/csv;charset=utf-8;" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `leads_${new Date().toISOString().slice(0, 10)}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }
                }}
              >
                <Download className="w-3.5 h-3.5" />
                CSVダウンロード
              </Button>
            </div>

            {/* Lead list */}
            {!leads || leads.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">リードがありません</div>
            ) : (
              <div className="space-y-3">
                {leads.map((lead) => {
                  const typeLabel: Record<string, string> = { host: "ホストファミリー", cooking_school: "料理教室", agent: "旅行代理店" };
                  const statusColor: Record<string, string> = {
                    new: "bg-blue-100 text-blue-700",
                    contacted: "bg-yellow-100 text-yellow-700",
                    qualified: "bg-green-100 text-green-700",
                    converted: "bg-purple-100 text-purple-700",
                    rejected: "bg-red-100 text-red-700",
                  };
                  const statusLabel: Record<string, string> = {
                    new: "新規", contacted: "連絡済み", qualified: "有望", converted: "成約", rejected: "不採用"
                  };
                  return (
                    <Card key={lead.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex flex-wrap gap-3 items-start justify-between">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-foreground">{lead.name}</span>
                              {lead.company && <span className="text-sm text-muted-foreground">{lead.company}</span>}
                              <Badge variant="outline" className="text-xs">{typeLabel[lead.type] ?? lead.type}</Badge>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[lead.status] ?? "bg-gray-100 text-gray-600"}`}>
                                {statusLabel[lead.status] ?? lead.status}
                              </span>
                              {lead.repliedAt && (
                                <span className="text-xs text-green-600">返信済 {new Date(lead.repliedAt).toLocaleDateString("ja-JP")}</span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{lead.email}</span>
                              <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>
                              {lead.prefecture && <span>{lead.prefecture}</span>}
                              {lead.nearestStation && <span>最寄駅: {lead.nearestStation}</span>}
                              {lead.agentRegion && <span>エリア: {lead.agentRegion}</span>}
                              {lead.agentCountry && <span>国: {lead.agentCountry}</span>}
                              {lead.specialtyRace && <span>得意層: {lead.specialtyRace}</span>}
                            </div>
                            {lead.notes && (
                              <p className="text-xs text-muted-foreground bg-muted rounded p-2 mt-1">メモ: {lead.notes}</p>
                            )}
                            <p className="text-xs text-muted-foreground">登録: {new Date(lead.createdAt).toLocaleDateString("ja-JP")}</p>
                          </div>
                          <div className="flex gap-1 flex-wrap">
                            {/* Status change */}
                            <Select
                              value={lead.status}
                              onValueChange={(v) => updateLead.mutate({ id: lead.id, status: v as "new" | "contacted" | "qualified" | "converted" | "rejected" })}
                            >
                              <SelectTrigger className="w-28 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">新規</SelectItem>
                                <SelectItem value="contacted">連絡済み</SelectItem>
                                <SelectItem value="qualified">有望</SelectItem>
                                <SelectItem value="converted">成約</SelectItem>
                                <SelectItem value="rejected">不採用</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm" variant="outline"
                              className="h-8 px-2"
                              onClick={() => { setSelectedLeadId(lead.id); setLeadNotes(lead.notes ?? ""); setShowLeadNotesDialog(true); }}
                            >
                              <StickyNote className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm" variant="outline"
                              className="h-8 px-2"
                              onClick={() => { setSelectedLeadId(lead.id); setLeadReplyMessage(""); setShowLeadReplyDialog(true); }}
                            >
                              <Reply className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm" variant="outline"
                              className="h-8 px-2 text-red-500 hover:text-red-600"
                              onClick={() => { setSelectedLeadId(lead.id); setShowLeadDeleteDialog(true); }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                        {/* Q&A */}
                        <div className="mt-3 grid md:grid-cols-2 gap-2">
                          <div className="bg-muted rounded p-2">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Q1回答</p>
                            <p className="text-xs">{lead.q1Answer}</p>
                          </div>
                          <div className="bg-muted rounded p-2">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Q2回答</p>
                            <p className="text-xs">{lead.q2Answer}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ─── Contacts tab ─────────────────────────────────────────── */}
          <TabsContent value="contacts" className="mt-4">
            <AdminContactsTab />
          </TabsContent>

          {/* ─── KYC tab ─────────────────────────────────────────── */}
          <TabsContent value="kyc" className="mt-4">
            <AdminKycTab />
          </TabsContent>
          {/* ─── Error Monitor tab ─────────────────────────────────────────── */}
          <TabsContent value="error-monitor" className="mt-4">
            <AdminErrorMonitorTab />
          </TabsContent>
        </Tabs>
      </div>
      {/* ─── Cooking School Detail Modal ───────────────────────────────────────────────────────── */}
      {/* ─── Lead Notes Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={showLeadNotesDialog} onOpenChange={(open) => { if (!open) { setShowLeadNotesDialog(false); setSelectedLeadId(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>メモ編集</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Textarea
              rows={5}
              value={leadNotes}
              onChange={(e) => setLeadNotes(e.target.value)}
              placeholder="リードに関するメモを入力してください…"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLeadNotesDialog(false)}>キャンセル</Button>
            <Button
              onClick={() => { if (selectedLeadId) updateLead.mutate({ id: selectedLeadId, notes: leadNotes }); }}
              disabled={updateLead.isPending}
            >
              {updateLead.isPending ? "保存中…" : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Lead Reply Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={showLeadReplyDialog} onOpenChange={(open) => { if (!open) { setShowLeadReplyDialog(false); setSelectedLeadId(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>返信メール送信</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">登録者のメールアドレス宛に返信メールを送信します。</p>
            <Textarea
              rows={6}
              value={leadReplyMessage}
              onChange={(e) => setLeadReplyMessage(e.target.value)}
              placeholder="返信内容を入力してください…"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLeadReplyDialog(false)}>キャンセル</Button>
            <Button
              onClick={() => { if (selectedLeadId) replyLead.mutate({ id: selectedLeadId, message: leadReplyMessage }); }}
              disabled={replyLead.isPending || !leadReplyMessage.trim()}
            >
              {replyLead.isPending ? "送信中…" : "送信"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Lead Delete Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={showLeadDeleteDialog} onOpenChange={(open) => { if (!open) { setShowLeadDeleteDialog(false); setSelectedLeadId(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>リードの削除</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">このリードを削除します。この操作は元に戻せません。</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLeadDeleteDialog(false)}>キャンセル</Button>
            <Button
              variant="destructive"
              onClick={() => { if (selectedLeadId) deleteLead.mutate({ id: selectedLeadId }); }}
              disabled={deleteLead.isPending}
            >
              {deleteLead.isPending ? "削除中…" : "削除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedSchool} onOpenChange={(open) => { if (!open) setSelectedSchool(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedSchool && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <School className="w-5 h-5 text-primary" />
                  {selectedSchool.nameJa}
                  {selectedSchool.nameEn && <span className="text-sm font-normal text-muted-foreground">/ {selectedSchool.nameEn}</span>}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Status */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{t("admin.status")}:</span>
                  {statusBadge(selectedSchool.approvalStatus)}
                </div>

                {/* Basic info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">{t("admin.area")}</p>
                    <p className="font-medium">{selectedSchool.prefecture} {selectedSchool.city}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">{t("admin.cuisineType")}</p>
                    <p className="font-medium">{selectedSchool.cuisineSpecialty ?? t("admin.notSet")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">{t("admin.maxStudents")}</p>
                    <p className="font-medium">{selectedSchool.maxStudents ?? t("admin.notSet")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">{t("admin.pricePerPerson")}</p>
                    <p className="font-medium">{selectedSchool.pricePerPersonJpy ? `¥${selectedSchool.pricePerPersonJpy.toLocaleString()}` : t("admin.notSet")}</p>
                  </div>
                </div>

                {/* Owner info */}
                <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                  <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-2">{t("admin.ownerInfo")}</p>
                  <p><span className="text-muted-foreground">{t("admin.ownerName")}:</span>{selectedSchool.ownerName ?? t("admin.notSet")}</p>
                  <p><span className="text-muted-foreground">{t("admin.ownerEmail")}:</span>{selectedSchool.ownerEmail ?? t("admin.notSet")}</p>
                  {selectedSchool.phoneNumber && (
                    <p className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-muted-foreground" />
                      {selectedSchool.phoneNumber}
                    </p>
                  )}
                  {selectedSchool.contactEmail && selectedSchool.contactEmail !== selectedSchool.ownerEmail && (
                    <p><span className="text-muted-foreground">{t("admin.contactEmail")}:</span>{selectedSchool.contactEmail}</p>
                  )}
                </div>

                {/* Business info */}
                {selectedSchool.businessLicenseNumber && (
                  <div className="text-sm">
                    <p className="text-muted-foreground text-xs mb-0.5">{t("admin.businessLicense")}</p>
                    <p className="font-mono font-medium">{selectedSchool.businessLicenseNumber}</p>
                  </div>
                )}

                {/* Description */}
                {selectedSchool.descriptionJa && (
                  <div className="text-sm">
                    <p className="text-muted-foreground text-xs mb-1">{t("admin.descriptionJa")}</p>
                    <p className="text-foreground/80 leading-relaxed line-clamp-4">{selectedSchool.descriptionJa}</p>
                  </div>
                )}

                {/* Languages */}
                {selectedSchool.languages && (
                  <div className="text-sm">
                    <p className="text-muted-foreground text-xs mb-1">{t("admin.languages")}</p>
                    <div className="flex gap-1 flex-wrap">
                      {(JSON.parse(selectedSchool.languages) as string[]).map((lang) => (
                        <Badge key={lang} variant="outline" className="text-xs">{lang}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Website */}
                {selectedSchool.websiteUrl && (
                  <a
                    href={selectedSchool.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {t("admin.checkWebsite")}
                  </a>
                )}

                <p className="text-xs text-muted-foreground">
                  {t("admin.appliedAt")}: {new Date(selectedSchool.createdAt).toLocaleDateString()}
                </p>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                {selectedSchool.approvalStatus === "pending" && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => { setShowRejectDialog(true); }}
                      disabled={rejectCS.isPending}
                    >
                      {t("admin.reject")}
                    </Button>
                    <Button
                      onClick={() => approveCS.mutate({ id: selectedSchool.id })}
                      disabled={approveCS.isPending}
                    >
                      {approveCS.isPending ? t("common.processing") : t("admin.approve")}
                    </Button>
                  </>
                )}
                {selectedSchool.approvalStatus === "approved" && (
                  <Button
                    variant="destructive"
                    onClick={() => setShowSuspendDialog(true)}
                    disabled={suspendCS.isPending}
                  >
                    {t("admin.suspend")}
                  </Button>
                )}
                {(selectedSchool.approvalStatus === "rejected" || selectedSchool.approvalStatus === "suspended") && (
                  <Button
                    onClick={() => approveCS.mutate({ id: selectedSchool.id })}
                    disabled={approveCS.isPending}
                  >
                    {t("admin.reApprove")}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Reject Reason Dialog ──────────────────────────────────────────── */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("admin.rejectReasonTitle")}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label className="text-sm mb-2 block">{t("admin.rejectReasonLabel")}</Label>
            <Textarea
              placeholder={t("admin.rejectReasonPlaceholder")}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>{t("common.cancel")}</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedSchool) {
                  rejectCS.mutate({ id: selectedSchool.id, reason: rejectReason || undefined });
                }
              }}
              disabled={rejectCS.isPending}
            >
              {rejectCS.isPending ? t("common.processing") : t("admin.rejectBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Suspend Reason Dialog ─────────────────────────────────────────── */}
      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("admin.suspendReasonTitle")}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label className="text-sm mb-2 block">{t("admin.suspendReasonLabel")}</Label>
            <Textarea
              placeholder={t("admin.suspendReasonPlaceholder")}
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuspendDialog(false)}>{t("common.cancel")}</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedSchool) {
                  suspendCS.mutate({ id: selectedSchool.id, reason: suspendReason || undefined });
                }
              }}
              disabled={suspendCS.isPending}
            >
              {suspendCS.isPending ? t("common.processing") : t("admin.suspendBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Host Reject Dialog ──────────────────────────────────────────── */}
      <Dialog open={showHostRejectDialog} onOpenChange={setShowHostRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("admin.hostRejectReasonTitle")}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label className="text-sm mb-2 block">{t("admin.rejectReasonLabel")}</Label>
            <Textarea
              placeholder={t("admin.hostRejectPlaceholder")}
              value={hostRejectReason}
              onChange={(e) => setHostRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHostRejectDialog(false)}>{t("common.cancel")}</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedHostId) {
                  rejectHost.mutate({ hostId: selectedHostId, reason: hostRejectReason || undefined });
                }
              }}
              disabled={rejectHost.isPending}
            >
              {rejectHost.isPending ? t("common.processing") : t("admin.rejectBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── ZOOM Interview Dialog ─────────────────────────────────────────── */}
      <Dialog open={showInterviewDialog} onOpenChange={setShowInterviewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("admin.zoomInterviewTitle")}</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm text-muted-foreground">
              {t("admin.zoomInterviewDesc")}
            </p>
            <div>
              <Label className="text-sm mb-1 block">{t("admin.interviewDatetime")}</Label>
              <Input
                type="datetime-local"
                value={interviewScheduledAt}
                onChange={(e) => setInterviewScheduledAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInterviewDialog(false)}>{t("common.cancel")}</Button>
            <Button
              onClick={() => {
                if (selectedHostId) {
                  setInterviewHost.mutate({
                    hostId: selectedHostId,
                    interviewScheduledAt: interviewScheduledAt || undefined,
                  });
                }
              }}
              disabled={setInterviewHost.isPending}
            >
              {setInterviewHost.isPending ? t("common.processing") : t("admin.setZoomStatus")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Inquiry Reject Dialog ────────────────────────────────── */}
      <Dialog open={showInquiryRejectDialog} onOpenChange={setShowInquiryRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("admin.inquiryRejectTitle")}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label className="text-sm mb-2 block">{t("admin.inquiryRejectReasonLabel")}</Label>
            <Textarea
              placeholder={t("admin.inquiryRejectPlaceholder")}
              value={inquiryRejectReason}
              onChange={(e) => setInquiryRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInquiryRejectDialog(false)}>{t("common.cancel")}</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedInquiryId) {
                  rejectInquiry.mutate({ id: selectedInquiryId, rejectionReason: inquiryRejectReason });
                }
              }}
              disabled={rejectInquiry.isPending || !inquiryRejectReason.trim()}
            >
              {rejectInquiry.isPending ? t("common.processing") : t("admin.rejectBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Payment Link Dialog ───────────────────────────────────── */}
      <Dialog open={showPaymentLinkDialog} onOpenChange={setShowPaymentLinkDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("admin.paymentLinkTitle")}</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm text-muted-foreground">
              {t("admin.paymentLinkDesc")}
            </p>
            <div>
              <Label className="text-sm mb-1 block">{t("admin.paymentLinkUrl")}</Label>
              <Input
                type="url"
                placeholder="https://buy.stripe.com/..."
                value={paymentLinkUrl}
                onChange={(e) => setPaymentLinkUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentLinkDialog(false)}>{t("common.cancel")}</Button>
            <Button
              onClick={() => {
                if (selectedInquiryId && paymentLinkUrl) {
                  sendPaymentLink.mutate({ id: selectedInquiryId, paymentLinkUrl });
                }
              }}
              disabled={sendPaymentLink.isPending || !paymentLinkUrl.trim()}
            >
              {sendPaymentLink.isPending ? t("common.sending") : t("admin.sendPaymentLinkBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Host Contact Dialog ────────────────────────────────────── */}
      <Dialog open={showHostContactDialog} onOpenChange={setShowHostContactDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("admin.hostContactTitle")}</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("admin.hostContactDesc", { id: contactInquiryId })}
            </p>
            <div>
              <Label className="text-sm mb-2 block font-medium">{t("admin.approvedHosts")}</Label>
              {approvedHosts && approvedHosts.length > 0 ? (
                <Select value={contactSelectedHostId} onValueChange={setContactSelectedHostId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("admin.selectHost")} />
                  </SelectTrigger>
                  <SelectContent>
                    {approvedHosts.map((h) => (
                      <SelectItem key={h.id} value={String(h.id)}>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {t("admin.hostLabel", { id: h.id })}
                            {h.prefecture && ` · ${h.prefecture}`}
                            {h.city && `${h.city}`}
                            {h.nearestStation && ` (${h.nearestStation})`}
                          </span>
                          {h.languages && (
                            <span className="text-xs text-muted-foreground">
                              {t("admin.languages")}: {(() => { try { return (JSON.parse(h.languages) as string[]).join(", "); } catch { return h.languages; } })()}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground bg-muted rounded p-3">
                  {t("admin.noApprovedHosts")}
                </p>
              )}
            </div>

            {contactSelectedHostId && approvedHosts && (() => {
              const h = approvedHosts.find((x) => String(x.id) === contactSelectedHostId);
              if (!h) return null;
              return (
                <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
                  <p className="font-medium">{t("admin.selectedHostDetail")}</p>
                  <p>{t("admin.area")}: {[h.prefecture, h.city, h.nearestStation].filter(Boolean).join(" / ") || t("admin.notSet")}</p>
                  <p>{t("admin.familyCount")}: {h.familyMemberCount ?? t("admin.notSet")}</p>
                  <p>{t("admin.canCook")}: {h.canCookTogether ? t("common.yes") : t("common.no")}</p>
                  {h.bioEn && <p className="text-muted-foreground text-xs line-clamp-2">{h.bioEn}</p>}
                </div>
              );
            })()}

            <div>
              <Label className="text-sm mb-2 block font-medium">{t("admin.staffNotes")}</Label>
              <Textarea
                placeholder={t("admin.staffNotesPlaceholder")}
                value={contactStaffNotes}
                onChange={(e) => setContactStaffNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHostContactDialog(false)}>{t("common.cancel")}</Button>
            <Button
              onClick={() => {
                if (contactInquiryId && contactSelectedHostId) {
                  contactHost.mutate({
                    id: contactInquiryId,
                    hostId: Number(contactSelectedHostId),
                    staffNotes: contactStaffNotes || undefined,
                  });
                }
              }}
              disabled={contactHost.isPending || !contactSelectedHostId}
            >
              {contactHost.isPending ? t("common.processing") : t("admin.startHostContact")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Video Call Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={showVideoCallDialog} onOpenChange={setShowVideoCallDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("admin.videoCallTitle")}</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("admin.videoCallDesc", { id: videoCallInquiryId })}
            </p>
            <div>
              <Label className="text-sm mb-2 block font-medium">{t("admin.videoCallDatetime")}</Label>
              <Input
                type="datetime-local"
                value={videoCallScheduledAt}
                onChange={(e) => setVideoCallScheduledAt(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm mb-2 block font-medium">{t("admin.meetingUrl")}</Label>
              <Input
                type="url"
                placeholder="https://zoom.us/j/..."
                value={videoCallMeetingUrl}
                onChange={(e) => setVideoCallMeetingUrl(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm mb-2 block font-medium">{t("calendar.memo")}</Label>
              <Textarea
                placeholder={t("admin.videoCallNotesPlaceholder")}
                value={videoCallNotes}
                onChange={(e) => setVideoCallNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVideoCallDialog(false)}>{t("common.cancel")}</Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => {
                if (videoCallInquiryId) {
                  setVideoCall.mutate({
                    id: videoCallInquiryId,
                    videoCallScheduledAt: videoCallScheduledAt || undefined,
                    videoCallMeetingUrl: videoCallMeetingUrl || undefined,
                    videoCallNotes: videoCallNotes || undefined,
                  });
                }
              }}
              disabled={setVideoCall.isPending}
            >
              {setVideoCall.isPending ? t("common.processing") : t("admin.setVideoCall")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
}

// ─── AdminContactsTab ─────────────────────────────────────────────────────────
function AdminContactsTab() {
  const { user, isAuthenticated } = useAuth();
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "in_progress" | "resolved">("new");
  const { data: contacts, refetch } = trpc.contact.list.useQuery(
    { status: statusFilter === "all" ? undefined : statusFilter },
    { enabled: isAuthenticated && user?.role === "admin" }
  );
  const updateStatus = trpc.contact.update.useMutation({
    onSuccess: () => { toast.success("ステータスを更新しました"); refetch(); },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  const statusColors: Record<string, string> = {
    open: "bg-yellow-100 text-yellow-700",
    in_progress: "bg-blue-100 text-blue-700",
    resolved: "bg-green-100 text-green-700",
    closed: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(["new", "all", "in_progress", "resolved"] as const).map((s) => (
          <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)}>
            {s === "all" ? "すべて" : s === "new" ? "未対応" : s === "in_progress" ? "対応中" : "解決済"}
          </Button>
        ))}
      </div>
      {!contacts || contacts.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">お問い合わせはありません</p>
      ) : (
        <div className="space-y-3">
          {contacts.map((c) => (
            <Card key={c.id} className="border border-border/60">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="font-medium text-sm">{c.name} <span className="text-muted-foreground font-normal">({c.email})</span></p>
                    <p className="text-xs text-muted-foreground">{c.inquiryType} · {new Date(c.createdAt).toLocaleDateString("ja-JP")}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[c.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {c.status}
                  </span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/40 rounded p-2">{c.message}</p>
                <div className="flex gap-2 flex-wrap">
                  {c.status === "new" && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: c.id, status: "in_progress" })}>
                      対応中にする
                    </Button>
                  )}
                  {c.status === "in_progress" && (
                    <Button size="sm" variant="outline" className="text-green-700 border-green-300" onClick={() => updateStatus.mutate({ id: c.id, status: "resolved" })}>
                      解決済みにする
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AdminKycTab ─────────────────────────────────────────────────────────────
function AdminKycTab() {
  const { user, isAuthenticated } = useAuth();
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const { data: submissions, refetch } = trpc.kyc.adminList.useQuery(
    { status: statusFilter === "all" ? undefined : statusFilter },
    { enabled: isAuthenticated && user?.role === "admin" }
  );
  const review = trpc.kyc.review.useMutation({
    onSuccess: () => { toast.success("KYC審査を更新しました"); refetch(); },
    onError: (err: { message: string }) => toast.error(err.message),
  });
  const [rejectNote, setRejectNote] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(["pending", "all", "approved", "rejected"] as const).map((s) => (
          <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)}>
            {s === "all" ? "すべて" : s === "pending" ? "審査待ち" : s === "approved" ? "承認済" : "却下"}
          </Button>
        ))}
      </div>
      {!submissions || submissions.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">KYC申請はありません</p>
      ) : (
        <div className="space-y-4">
          {submissions.map((s) => (
            <Card key={s.id} className="border border-border/60">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="font-medium text-sm">申請 #{s.id}</p>
                    <p className="text-xs text-muted-foreground">
                      書類種別: {s.documentType} · 申請日: {new Date(s.submittedAt).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                  <Badge variant={s.status === "approved" ? "default" : s.status === "rejected" ? "destructive" : "secondary"}>
                    {s.status === "pending" ? "審査待ち" : s.status === "approved" ? "承認済" : "却下"}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {s.documentFrontUrl && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">書類（表面）</p>
                      <a href={s.documentFrontUrl} target="_blank" rel="noopener noreferrer">
                        <img src={s.documentFrontUrl} alt="書類表面" className="max-h-40 rounded border object-contain w-full" />
                      </a>
                    </div>
                  )}
                  {s.documentBackUrl && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">書類（裏面）</p>
                      <a href={s.documentBackUrl} target="_blank" rel="noopener noreferrer">
                        <img src={s.documentBackUrl} alt="書類裏面" className="max-h-40 rounded border object-contain w-full" />
                      </a>
                    </div>
                  )}
                  {s.selfieUrl && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">自撮り写真</p>
                      <a href={s.selfieUrl} target="_blank" rel="noopener noreferrer">
                        <img src={s.selfieUrl} alt="自撮り" className="max-h-40 rounded border object-contain w-full" />
                      </a>
                    </div>
                  )}
                </div>
                {s.status === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => review.mutate({ submissionId: s.id, userId: s.userId, decision: "approved" })}>
                      承認する
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => { setSelectedId(s.id); setShowRejectDialog(true); }}>
                      却下する
                    </Button>
                  </div>
                )}
                {s.reviewNote && (
                  <p className="text-xs text-muted-foreground bg-muted rounded p-2">審査メモ: {s.reviewNote}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={showRejectDialog} onOpenChange={(open) => { if (!open) { setShowRejectDialog(false); setSelectedId(null); setRejectNote(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>KYC却下理由</DialogTitle></DialogHeader>
          <Textarea rows={3} value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="却下理由を入力してください（ユーザーにメールで通知されます）" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>キャンセル</Button>
            <Button variant="destructive" onClick={() => { if (selectedId) { const sub = submissions?.find((x) => x.id === selectedId); if (sub) review.mutate({ submissionId: selectedId, userId: sub.userId, decision: "rejected", reviewNote: rejectNote }); } setShowRejectDialog(false); }}>
              却下する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── 循環型エラー発見システム — 管理画面ダッシュボード ─────────────────────────────────
function AdminErrorMonitorTab() {
  const { user, isAuthenticated } = useAuth();
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "resolved" | "ignored">("open");
  const [selectedErrorId, setSelectedErrorId] = useState<number | null>(null);
  const [resolveNote, setResolveNote] = useState("");
  const [showResolveDialog, setShowResolveDialog] = useState(false);

  const { data: errors, refetch } = trpc.errorMonitor.list.useQuery(
    { status: statusFilter === "all" ? undefined : statusFilter, limit: 100 },
    { enabled: isAuthenticated && user?.role === "admin", refetchInterval: 30000 }
  );
  const { data: summary } = trpc.errorMonitor.summary.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === "admin", refetchInterval: 60000 }
  );

  const resolve = trpc.errorMonitor.resolve.useMutation({
    onSuccess: () => {
      toast.success("エラーを解決済みにしました");
      setShowResolveDialog(false);
      setSelectedErrorId(null);
      setResolveNote("");
      refetch();
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });
  const ignore = trpc.errorMonitor.ignore.useMutation({
    onSuccess: () => { toast.success("エラーを無視しました"); refetch(); },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  const statusColors: Record<string, string> = {
    open: "bg-red-100 text-red-700 border-red-200",
    resolved: "bg-green-100 text-green-700 border-green-200",
    ignored: "bg-gray-100 text-gray-500 border-gray-200",
  };
  const sourceColors: Record<string, string> = {
    frontend: "bg-blue-100 text-blue-700",
    backend: "bg-orange-100 text-orange-700",
    api: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="space-y-6">
      {/* サマリーカード */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 flex items-center gap-3">
              <XCircle className="text-red-500 flex-shrink-0" size={24} />
              <div>
                <p className="text-2xl font-bold text-red-700">{summary.open}</p>
                <p className="text-xs text-red-600">未解決エラー</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="text-orange-500 flex-shrink-0" size={24} />
              <div>
                <p className="text-2xl font-bold text-orange-700">{summary.critical}</p>
                <p className="text-xs text-orange-600">クリティカル（5回以上）</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="text-green-500 flex-shrink-0" size={24} />
              <div>
                <p className="text-2xl font-bold text-green-700">{summary.total - summary.open}</p>
                <p className="text-xs text-green-600">解決済み</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <RefreshCw className="text-muted-foreground flex-shrink-0" size={24} />
              <div>
                <p className="text-2xl font-bold">{summary.total}</p>
                <p className="text-xs text-muted-foreground">総エラー数</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* フィルター */}
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-sm text-muted-foreground font-medium">ステータス:</span>
        {(["open", "all", "resolved", "ignored"] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={statusFilter === s ? "default" : "outline"}
            onClick={() => setStatusFilter(s)}
            className="text-xs"
          >
            {s === "open" ? "未解決" : s === "resolved" ? "解決済み" : s === "ignored" ? "無視" : "すべて"}
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={() => refetch()} className="ml-auto text-xs gap-1">
          <RefreshCw size={12} /> 更新
        </Button>
      </div>

      {/* エラー一覧 */}
      {!errors || errors.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">エラーはありません</p>
          <p className="text-xs text-muted-foreground mt-1">システムは正常に動作しています</p>
        </div>
      ) : (
        <div className="space-y-3">
          {errors.map((err) => (
            <Card key={err.id} className={`border ${err.occurrenceCount >= 5 ? "border-red-300 bg-red-50/30" : "border-border"}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge className={`text-xs border ${statusColors[err.status] ?? ""}`}>
                        {err.status === "open" ? "未解決" : err.status === "resolved" ? "解決済み" : "無視"}
                      </Badge>
                      <Badge className={`text-xs ${sourceColors[err.source] ?? "bg-gray-100 text-gray-700"}`}>
                        {err.source}
                      </Badge>
                      {err.occurrenceCount >= 5 && (
                        <Badge className="text-xs bg-red-600 text-white">
                          🔥 {err.occurrenceCount}回発生
                        </Badge>
                      )}
                      {err.occurrenceCount < 5 && err.occurrenceCount > 1 && (
                        <span className="text-xs text-muted-foreground">{err.occurrenceCount}回</span>
                      )}
                    </div>
                    <p className="font-medium text-sm text-foreground truncate">{err.errorType}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{err.message}</p>
                    {err.url && (
                      <p className="text-xs text-blue-600 mt-0.5 truncate">{err.url}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      最終発生: {new Date(err.updatedAt).toLocaleString("ja-JP")}
                      {err.resolvedAt && ` · 解決: ${new Date(err.resolvedAt).toLocaleString("ja-JP")}`}
                    </p>
                    {err.resolveNote && (
                      <p className="text-xs bg-green-50 text-green-700 rounded p-2 mt-2">解決メモ: {err.resolveNote}</p>
                    )}
                  </div>
                  {err.status === "open" && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs gap-1 text-green-700 border-green-300 hover:bg-green-50"
                        onClick={() => { setSelectedErrorId(err.id); setShowResolveDialog(true); }}
                      >
                        <CheckCircle size={12} /> 解決済みにする
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-muted-foreground"
                        onClick={() => ignore.mutate({ id: err.id })}
                      >
                        <XCircle size={12} />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 解決ダイアログ */}
      <Dialog open={showResolveDialog} onOpenChange={(open) => { if (!open) { setShowResolveDialog(false); setSelectedErrorId(null); setResolveNote(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>エラーを解決済みにする</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">解決した方法や対応内容を記録してください（任意）</p>
            <Textarea
              rows={3}
              value={resolveNote}
              onChange={(e) => setResolveNote(e.target.value)}
              placeholder="例: キャッシュクリアで解決 / コード修正済み（PR #123）"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(false)}>キャンセル</Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                if (selectedErrorId) {
                  resolve.mutate({ id: selectedErrorId, resolveNote: resolveNote || undefined });
                }
              }}
            >
              解決済みにする
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
