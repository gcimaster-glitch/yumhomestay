import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  Building2, Users, TrendingUp, DollarSign,
  Plus, FileText, CheckCircle, Clock, XCircle,
  BarChart3, Globe
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AgentDashboard() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { isAuthenticated, loading } = useAuth();

  const STATUS_CONFIG: Record<string, { labelKey: string; color: string; icon: React.ElementType }> = {
    pending: { labelKey: "booking.statusPending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
    confirmed: { labelKey: "booking.statusConfirmed", color: "bg-green-100 text-green-800", icon: CheckCircle },
    completed: { labelKey: "booking.statusCompleted", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
    cancelled_by_guest: { labelKey: "booking.statusCancelledGuest", color: "bg-red-100 text-red-800", icon: XCircle },
    cancelled_by_host: { labelKey: "booking.statusCancelledHost", color: "bg-red-100 text-red-800", icon: XCircle },
    cancelled_by_admin: { labelKey: "booking.statusCancelledAdmin", color: "bg-red-100 text-red-800", icon: XCircle },
  };

  const { data: profile, isLoading: profileLoading } = trpc.user.getProfile.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: agentData, isLoading: agentDataLoading } = trpc.booking.getMyAgent.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  // agentData from DB takes priority; fallback to profile-based mock for non-agent users
  // DB schema: agents.name (not nameJa), agents.status (not approvalStatus)
  const agent = agentData ?? (profile?.userType === "agent" ? { id: 0, name: profile.name ?? t("agentDashboard.defaultName"), nameEn: null, status: "active" as const, commissionRate: "10" } : null);
  const agentLoading = profileLoading || agentDataLoading;

  const { data: agentBookings, isLoading: bookingsLoading } = trpc.booking.agentBookings.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (loading || agentLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center max-w-lg">
          <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">{t("agentDashboard.notFound")}</h2>
          <p className="text-muted-foreground mb-6">
            {t("agentDashboard.notFoundDesc")}
          </p>
          <Button onClick={() => navigate("/")}>{t("common.backToHome")}</Button>
        </div>
        <Footer />
      </div>
    );
  }

  type BookingItem = NonNullable<typeof agentBookings>[number];
  const bookings: BookingItem[] = agentBookings ?? [];
  const completedBookings = bookings.filter((b) => b.status === "completed");
  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
  const totalAgentFee = completedBookings.reduce((sum: number, b: { agentFeeJpy: number | null }) => sum + (b.agentFeeJpy ?? 0), 0);
  const totalRevenue = completedBookings.reduce((sum: number, b: { amountJpy: number }) => sum + b.amountJpy, 0);

  const stats = [
    {
      labelKey: "agentDashboard.statTotalBookings",
      value: bookings.length,
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      labelKey: "agentDashboard.statCompleted",
      value: completedBookings.length,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      labelKey: "agentDashboard.statCommission",
      value: `¥${totalAgentFee.toLocaleString()}`,
      icon: DollarSign,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      labelKey: "agentDashboard.statTotalRevenue",
      value: `¥${totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-10 max-w-6xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">{t("agentDashboard.title")}</span>
            </div>
            <h1 className="text-3xl font-bold">{agent.name}</h1>
            {agent.nameEn && <p className="text-muted-foreground">{agent.nameEn}</p>}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={agent.status === "active" ? "default" : "secondary"}>
                {agent.status === "active" ? t("cookingSchoolDashboard.statusApproved") : t("cookingSchoolDashboard.statusSuspended")}
              </Badge>
              {agent.commissionRate && (
                <Badge variant="outline">{t("agentDashboard.commissionRate")}: {agent.commissionRate}%</Badge>
              )}
            </div>
          </div>
          <Button onClick={() => navigate("/experiences")} className="gap-2">
            <Plus className="w-4 h-4" />
            {t("agentDashboard.newBooking")}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.labelKey}>
                <CardContent className="pt-6">
                  <div className={`inline-flex p-2 rounded-lg ${stat.bg} mb-3`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{t(stat.labelKey)}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Active Bookings Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="font-semibold text-yellow-800">{t("booking.statusPending")}</span>
              </div>
              <p className="text-3xl font-bold text-yellow-700">{pendingBookings.length}</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-green-800">{t("booking.statusConfirmed")}</span>
              </div>
              <p className="text-3xl font-bold text-green-700">{confirmedBookings.length}</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-blue-800">{t("agentDashboard.completedThisMonth")}</span>
              </div>
              <p className="text-3xl font-bold text-blue-700">
                {completedBookings.filter((b: { completedAt: Date | null; updatedAt: Date }) => {
                  const d = new Date(b.completedAt ?? b.updatedAt);
                  const now = new Date();
                  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Booking List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {t("agentDashboard.bookingList")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">{t("cookingSchoolDashboard.noBookings")}</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate("/experiences")}
                >
                  {t("nav.experiences")}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking: { id: number; status: string; startTime: Date; adultsCount: number; childrenCount: number; amountJpy: number; agentFeeJpy: number | null; completedAt: Date | null; updatedAt: Date }) => {
                  const statusConf = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
                  const StatusIcon = statusConf.icon;
                  return (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/bookings/${booking.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Globe className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{t("cookingSchoolDashboard.bookingNumber", { id: booking.id })}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(booking.startTime).toLocaleDateString()} ·
                            {booking.adultsCount + booking.childrenCount}{t("common.person")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-semibold">¥{booking.amountJpy.toLocaleString()}</p>
                          {booking.agentFeeJpy && (
                            <p className="text-xs text-green-600">{t("agentDashboard.commission")} ¥{booking.agentFeeJpy.toLocaleString()}</p>
                          )}
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusConf.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {t(statusConf.labelKey)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Commission Report */}
        {completedBookings.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                {t("agentDashboard.commissionReport")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t("agentDashboard.totalHandled")}</p>
                  <p className="text-2xl font-bold">¥{totalRevenue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t("agentDashboard.totalCommission")}</p>
                  <p className="text-2xl font-bold text-green-600">¥{totalAgentFee.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t("agentDashboard.effectiveRate")}</p>
                  <p className="text-2xl font-bold">
                    {totalRevenue > 0 ? ((totalAgentFee / totalRevenue) * 100).toFixed(1) : "0.0"}%
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                {t("agentDashboard.paymentNote")}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  );
}
