import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  UserX,
  Star,
  HelpCircle,
  Eye,
} from "lucide-react";
import { useState } from "react";
import { Link, useSearch } from "wouter";
import { useTranslation } from "react-i18next";

export default function TroubleReport() {
  const { t } = useTranslation();
  const { isAuthenticated, loading } = useAuth();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const defaultBookingId = params.get("bookingId") ? Number(params.get("bookingId")) : undefined;

  const [category, setCategory] = useState<string>("");
  const [description, setDescription] = useState("");
  const [bookingId, setBookingId] = useState<string>(defaultBookingId ? String(defaultBookingId) : "");
  const [submitted, setSubmitted] = useState(false);

  const { data: myBookings } = trpc.booking.myBookings.useQuery(undefined, { enabled: isAuthenticated });

  const submitReport = trpc.trouble.create.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  const CATEGORIES = [
    {
      value: "no_show",
      label: t("troubleReport.categoryNoShow"),
      icon: <UserX className="w-4 h-4" />,
      description: t("troubleReport.categoryNoShowDesc"),
    },
    {
      value: "safety",
      label: t("troubleReport.categorySafety"),
      icon: <ShieldAlert className="w-4 h-4" />,
      description: t("troubleReport.categorySafetyDesc"),
    },
    {
      value: "fraud",
      label: t("troubleReport.categoryFraud"),
      icon: <AlertTriangle className="w-4 h-4" />,
      description: t("troubleReport.categoryFraudDesc"),
    },
    {
      value: "quality",
      label: t("troubleReport.categoryQuality"),
      icon: <Star className="w-4 h-4" />,
      description: t("troubleReport.categoryQualityDesc"),
    },
    {
      value: "other",
      label: t("troubleReport.categoryOther"),
      icon: <HelpCircle className="w-4 h-4" />,
      description: t("troubleReport.categoryOtherDesc"),
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) { toast.error(t("troubleReport.errorSelectCategory")); return; }
    if (description.length < 20) { toast.error(t("troubleReport.errorDescriptionLength")); return; }

    submitReport.mutate({
      bookingId: bookingId ? Number(bookingId) : undefined,
      category: category as "no_show" | "safety" | "fraud" | "quality" | "other",
      description,
    });
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <ShieldAlert className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">{t("troubleReport.loginRequired")}</p>
            <a href={getLoginUrl()}><Button>{t("common.login")}</Button></a>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">{t("troubleReport.submitted")}</h2>
            <p className="text-muted-foreground mb-6">
              {t("troubleReport.submittedDesc")}
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/bookings">
                <Button variant="outline">{t("troubleReport.goToBookings")}</Button>
              </Link>
              <Link href="/">
                <Button>{t("common.backToHome")}</Button>
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="container py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h1 className="text-2xl font-bold text-foreground">{t("troubleReport.title")}</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            {t("troubleReport.subtitle")}
          </p>
        </div>

        {/* Privacy note */}
        <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
          <Eye className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-700">
            {t("troubleReport.privacyNote")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("troubleReport.categoryLabel")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    category === cat.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-center gap-2 font-medium text-sm text-foreground mb-0.5">
                    <span className={category === cat.value ? "text-primary" : "text-muted-foreground"}>
                      {cat.icon}
                    </span>
                    {cat.label}
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">{cat.description}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Related booking */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("troubleReport.relatedBooking")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {myBookings && myBookings.length > 0 ? (
                <div>
                  <Label htmlFor="booking-select">{t("troubleReport.selectBooking")}</Label>
                  <Select value={bookingId} onValueChange={setBookingId}>
                    <SelectTrigger id="booking-select" className="mt-1">
                      <SelectValue placeholder={t("troubleReport.selectBookingPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{t("troubleReport.noSelection")}</SelectItem>
                      {myBookings.map((b) => (
                        <SelectItem key={b.id} value={String(b.id)}>
                          {t("troubleReport.bookingItem", { id: b.id, date: new Date(b.startTime).toLocaleDateString(), status: b.status })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div>
                  <Label htmlFor="booking-id">{t("troubleReport.bookingIdLabel")}</Label>
                  <Input
                    id="booking-id"
                    type="number"
                    placeholder={t("troubleReport.bookingIdPlaceholder")}
                    value={bookingId}
                    onChange={(e) => setBookingId(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("troubleReport.descriptionLabel")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="description">
                {t("troubleReport.descriptionHint")}
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("troubleReport.descriptionPlaceholder")}
                rows={6}
                className="mt-1 resize-none"
              />
              <p className={`text-xs text-right ${description.length < 20 ? "text-muted-foreground" : "text-green-600"}`}>
                {t("troubleReport.charCount", { count: description.length })}
              </p>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-3">
            <Link href="/bookings" className="flex-1">
              <Button type="button" variant="outline" className="w-full">
                {t("common.cancel")}
              </Button>
            </Link>
            <Button
              type="submit"
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
              disabled={submitReport.isPending || !category || description.length < 20}
            >
              {submitReport.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t("common.processing")}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {t("troubleReport.submit")}
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
}
