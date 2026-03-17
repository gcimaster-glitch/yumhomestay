import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  ChefHat, Calendar, Users, TrendingUp, MapPin, Globe,
  CheckCircle, Clock, XCircle, Plus, Settings, BookOpen, Star
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { TrendBadge } from "@/components/TrendBadge";

export default function CookingSchoolDashboard() {
  const { t } = useTranslation();
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const statusConfig = {
    pending: { labelKey: "cookingSchoolDashboard.statusPending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
    interview: { labelKey: "cookingSchoolDashboard.statusInterview", color: "bg-blue-100 text-blue-800", icon: Clock },
    approved: { labelKey: "cookingSchoolDashboard.statusApproved", color: "bg-green-100 text-green-800", icon: CheckCircle },
    rejected: { labelKey: "cookingSchoolDashboard.statusRejected", color: "bg-red-100 text-red-800", icon: XCircle },
    suspended: { labelKey: "cookingSchoolDashboard.statusSuspended", color: "bg-gray-100 text-gray-800", icon: XCircle },
  };

  const { data: school, isLoading } = trpc.cookingSchool.myProfile.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: myExperiences } = trpc.cookingSchool.myAllExperiences.useQuery(undefined, {
    enabled: !!user && !!school,
  });

  const { data: myBookings } = trpc.cookingSchool.myBookings.useQuery(undefined, {
    enabled: !!user && !!school,
  });

  const { data: ratingSummary } = trpc.cookingSchool.myRatingSummary.useQuery(undefined, {
    enabled: !!user && !!school,
  });

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  if (!school) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center max-w-2xl">
          <ChefHat className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-4">{t("cookingSchoolDashboard.notRegistered")}</h1>
          <p className="text-muted-foreground mb-8">
            {t("cookingSchoolDashboard.notRegisteredDesc")}
          </p>
          <Button onClick={() => navigate("/cooking-school/register")} size="lg">
            <Plus className="w-4 h-4 mr-2" />
            {t("cookingSchoolDashboard.registerBtn")}
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const status = statusConfig[school.approvalStatus as keyof typeof statusConfig] ?? statusConfig.pending;
  const StatusIcon = status.icon;
  const languages = school.languages ? JSON.parse(school.languages) as string[] : [];

  const confirmedBookings = (myBookings ?? []).filter((b: { status: string }) => b.status === "confirmed");
  const completedBookings = (myBookings ?? []).filter((b: { status: string }) => b.status === "completed");
  const totalRevenue = completedBookings.reduce((sum: number, b: { hostPayoutJpy: number }) => sum + b.hostPayoutJpy, 0);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const monthlyRevenue = completedBookings
    .filter((b) => {
      const completedAt = (b as { completedAt?: Date | string | null }).completedAt;
      const d = completedAt ? new Date(completedAt as string) : null;
      return d && d >= startOfMonth;
    })
    .reduce((sum: number, b: { hostPayoutJpy: number }) => sum + b.hostPayoutJpy, 0);

  const lastMonthRevenue = completedBookings
    .filter((b) => {
      const completedAt = (b as { completedAt?: Date | string | null }).completedAt;
      const d = completedAt ? new Date(completedAt as string) : null;
      return d && d >= startOfLastMonth && d < startOfMonth;
    })
    .reduce((sum: number, b: { hostPayoutJpy: number }) => sum + b.hostPayoutJpy, 0);

  const currentMonthCompleted = completedBookings.filter((b) => {
    const completedAt = (b as { completedAt?: Date | string | null }).completedAt;
    const d = completedAt ? new Date(completedAt as string) : null;
    return d && d >= startOfMonth;
  }).length;

  const lastMonthCompleted = completedBookings.filter((b) => {
    const completedAt = (b as { completedAt?: Date | string | null }).completedAt;
    const d = completedAt ? new Date(completedAt as string) : null;
    return d && d >= startOfLastMonth && d < startOfMonth;
  }).length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-8 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <ChefHat className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{school.nameJa}</h1>
              {school.nameEn && <p className="text-muted-foreground">{school.nameEn}</p>}
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mt-1 ${status.color}`}>
                <StatusIcon className="w-3 h-3" />
                {t(status.labelKey)}
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => navigate("/cooking-school/settings")}>
            <Settings className="w-4 h-4 mr-2" />
            {t("cookingSchoolDashboard.settings")}
          </Button>
        </div>

        {/* Approval pending notice */}
        {school.approvalStatus === "pending" && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 mb-6">
            <p className="text-sm text-amber-800">
              <strong>{t("cookingSchoolDashboard.reviewingTitle")}</strong>
              {t("cookingSchoolDashboard.reviewingDesc")}
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{myExperiences?.length ?? 0}</p>
                  <p className="text-xs text-muted-foreground">{t("cookingSchoolDashboard.statPrograms")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{confirmedBookings.length}</p>
                  <p className="text-xs text-muted-foreground">{t("cookingSchoolDashboard.statConfirmed")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedBookings.length}</p>
                  <p className="text-xs text-muted-foreground">{t("cookingSchoolDashboard.statCompleted")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">¥{monthlyRevenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{t("cookingSchoolDashboard.statMonthlyRevenue")}</p>
                  <TrendBadge current={monthlyRevenue} previous={lastMonthRevenue} unit="" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">¥{totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{t("cookingSchoolDashboard.statRevenue")}</p>
                  <TrendBadge current={currentMonthCompleted} previous={lastMonthCompleted} unit="" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {ratingSummary && ratingSummary.count > 0
                      ? `★${ratingSummary.avgRating.toFixed(1)}`
                      : "--"}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("cookingSchoolDashboard.statRating")}</p>
                  {ratingSummary && ratingSummary.count > 0 && (
                    <p className="text-xs text-muted-foreground">{ratingSummary.count}{t("hostDashboard.reviews")}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList className="mb-6 flex-wrap h-auto gap-1 sm:flex-nowrap sm:h-10">
            <TabsTrigger value="overview">{t("cookingSchoolDashboard.tabOverview")}</TabsTrigger>
            <TabsTrigger value="experiences">{t("cookingSchoolDashboard.tabExperiences")}</TabsTrigger>
            <TabsTrigger value="bookings">{t("cookingSchoolDashboard.tabBookings")}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("cookingSchoolDashboard.schoolInfo")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {school.prefecture && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{[school.prefecture, school.city].filter(Boolean).join(" ")}</span>
                    </div>
                  )}
                  {school.nearestStation && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">{t("cookingSchoolDashboard.nearestStation")}：</span>
                      <span>{school.nearestStation}</span>
                    </div>
                  )}
                  {school.maxCapacity && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>{t("cookingSchoolDashboard.maxCapacity", { count: school.maxCapacity })}</span>
                    </div>
                  )}
                  {languages.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <div className="flex gap-1 flex-wrap">
                        {languages.map((l: string) => (
                          <Badge key={l} variant="secondary" className="text-xs">{l.toUpperCase()}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {school.hasKitchenEquipment && <Badge variant="outline" className="text-xs">{t("cookingSchoolRegister.hasKitchenEquipment")}</Badge>}
                    {school.hasWheelchairAccess && <Badge variant="outline" className="text-xs">{t("cookingSchoolRegister.hasWheelchairAccess")}</Badge>}
                    {school.hasHalalKitchen && <Badge variant="outline" className="text-xs">{t("cookingSchoolRegister.hasHalalKitchen")}</Badge>}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("cookingSchoolDashboard.nextSteps")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className={`flex items-center gap-3 p-3 rounded-lg ${school.approvalStatus === "approved" ? "bg-green-50" : "bg-muted"}`}>
                    <CheckCircle className={`w-5 h-5 ${school.approvalStatus === "approved" ? "text-green-600" : "text-muted-foreground"}`} />
                    <div>
                      <p className="text-sm font-medium">{t("cookingSchoolDashboard.stepApproval")}</p>
                      <p className="text-xs text-muted-foreground">
                        {school.approvalStatus === "approved" ? t("common.completed") : t("cookingSchoolDashboard.statusPending")}
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-3 p-3 rounded-lg ${(myExperiences?.length ?? 0) > 0 ? "bg-green-50" : "bg-muted"}`}>
                    <BookOpen className={`w-5 h-5 ${(myExperiences?.length ?? 0) > 0 ? "text-green-600" : "text-muted-foreground"}`} />
                    <div>
                      <p className="text-sm font-medium">{t("cookingSchoolDashboard.stepPrograms")}</p>
                      <p className="text-xs text-muted-foreground">
                        {(myExperiences?.length ?? 0) > 0
                          ? t("cookingSchoolDashboard.programsRegistered", { count: myExperiences!.length })
                          : t("cookingSchoolDashboard.programsNone")}
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-3 p-3 rounded-lg ${confirmedBookings.length > 0 ? "bg-green-50" : "bg-muted"}`}>
                    <Calendar className={`w-5 h-5 ${confirmedBookings.length > 0 ? "text-green-600" : "text-muted-foreground"}`} />
                    <div>
                      <p className="text-sm font-medium">{t("cookingSchoolDashboard.stepBookings")}</p>
                      <p className="text-xs text-muted-foreground">
                        {confirmedBookings.length > 0
                          ? t("cookingSchoolDashboard.bookingsConfirmed", { count: confirmedBookings.length })
                          : t("cookingSchoolDashboard.bookingsWaiting")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="experiences">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold">{t("cookingSchoolDashboard.experienceList")}</h2>
              {school.approvalStatus === "approved" && (
                <Button size="sm" className="w-full sm:w-auto" onClick={() => navigate("/host/experiences/new")}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t("cookingSchoolDashboard.addExperience")}
                </Button>
              )}
            </div>
            {!myExperiences || myExperiences.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">{t("cookingSchoolDashboard.noExperiences")}</p>
                  {school.approvalStatus === "approved" && (
                    <Button className="mt-4" onClick={() => navigate("/host/experiences/new")}>
                      {t("cookingSchoolDashboard.registerFirstExperience")}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myExperiences.map((row) => {
                  const joined = row as unknown as { experiences: { id: number; titleJa?: string | null; titleEn?: string | null; descriptionJa?: string | null; descriptionEn?: string | null; priceJpy: number; durationMinutes?: number | null; isActive?: boolean | null } };
                  const e = joined.experiences ?? (row as unknown as { id: number; titleJa?: string | null; titleEn?: string | null; descriptionJa?: string | null; descriptionEn?: string | null; priceJpy: number; durationMinutes?: number | null; isActive?: boolean | null });
                  return (
                    <Card key={e.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{e.titleJa ?? e.titleEn ?? `${t("cookingSchoolDashboard.experience")} #${e.id}`}</h3>
                          <Badge variant={e.isActive ? "default" : "secondary"}>
                            {e.isActive ? t("cookingSchoolDashboard.published") : t("cookingSchoolDashboard.unpublished")}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {e.descriptionJa ?? e.descriptionEn ?? ""}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">¥{e.priceJpy.toLocaleString()}/{t("common.person")}</span>
                          <span className="text-muted-foreground">{e.durationMinutes ?? "—"}{t("common.minutes")}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bookings">
            <h2 className="text-lg font-semibold mb-4">{t("cookingSchoolDashboard.bookingManagement")}</h2>
            {!myBookings || myBookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">{t("cookingSchoolDashboard.noBookings")}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {myBookings.map((booking: { id: number; startTime: number | Date; status: string; hostPayoutJpy: number }) => (
                  <Card key={booking.id} className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/bookings/${booking.id}`)}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{t("cookingSchoolDashboard.bookingNumber", { id: booking.id })}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(booking.startTime).toLocaleDateString()}
                            {" "}
                            {new Date(booking.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={
                            booking.status === "confirmed" ? "default" :
                            booking.status === "completed" ? "secondary" :
                            booking.status === "pending" ? "outline" : "destructive"
                          }>
                            {booking.status === "pending" ? t("booking.statusPending") :
                             booking.status === "confirmed" ? t("booking.statusConfirmed") :
                             booking.status === "completed" ? t("booking.statusCompleted") : t("booking.statusCancelled")}
                          </Badge>
                          <p className="text-sm font-medium mt-1">
                            ¥{booking.hostPayoutJpy.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
