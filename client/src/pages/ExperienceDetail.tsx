import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { ChefHat, Clock, Users, ChevronLeft, ChevronRight, CalendarDays, CheckCircle2, AlertCircle, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ReviewSection } from "@/components/ReviewSection";
import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "wouter";

// ─── YHS Fixed Pricing ────────────────────────────────────────────────────────
const YHS_BASE = 55000;          // 大人2名・基本パッケージ（税込）
const YHS_EXTRA_ADULT = 22000;   // 追加大人1名あたり（税込）
const YHS_EXTRA_CHILD = 11000;   // 子供（5歳以上）1名あたり（税込）
const YHS_EXTRA_INFANT = 5500;   // 幼児（5歳未満）1名あたり（税込）

// Month/day names are now handled via i18n

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// ─── GuestCounter ─────────────────────────────────────────────────────────────
function GuestCounter({
  label, sub, value, min, max, onChange,
}: { label: string; sub: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-lg font-medium disabled:opacity-30 hover:bg-muted transition-colors"
        >−</button>
        <span className="w-6 text-center font-semibold">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-lg font-medium disabled:opacity-30 hover:bg-muted transition-colors"
        >＋</button>
      </div>
    </div>
  );
}

export default function ExperienceDetail() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();

  // ─── Guest counts ──────────────────────────────────────────────────────────
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);

  // ─── Calendar state ────────────────────────────────────────────────────────
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [selectedSlotTime, setSelectedSlotTime] = useState<string | null>(null);

  // ─── Other form fields ─────────────────────────────────────────────────────
  const [currency, setCurrency] = useState("JPY");
  const [dietary, setDietary] = useState("");
  const [special, setSpecial] = useState("");
  const [pickupStation, setPickupStation] = useState("");
  const [videoCallTimes, setVideoCallTimes] = useState<string[]>(["", "", ""]);
  const [isRedirectingToPayment, setIsRedirectingToPayment] = useState(false);

  // ─── Inquiry dialog state ──────────────────────────────────────────────────
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiryDates, setInquiryDates] = useState("");
  const [inquiryCount, setInquiryCount] = useState(2);
  const [inquiryMessage, setInquiryMessage] = useState("");

  // ─── Data fetching ─────────────────────────────────────────────────────────
  const { data: exp, isLoading } = trpc.experience.getById.useQuery({ id: Number(id) });
  const { data: ratingSummary } = trpc.experience.getRatingSummary.useQuery(
    { id: Number(id) },
    { enabled: !!id }
  );
  const { data: currencyData } = trpc.payment.getCurrencies.useQuery();

  const fromDate = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-01`;
  const lastDay = getDaysInMonth(calYear, calMonth);
  const toDate = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const { data: availSlots, isLoading: slotsLoading } = trpc.availability.getHostSlots.useQuery(
    { hostId: exp?.hostId ?? 0, fromDate, toDate },
    { enabled: !!exp?.hostId }
  );

  // ─── Available dates set (for calendar highlighting) ──────────────────────
  const availableDates = useMemo(() => {
    if (!availSlots) return new Set<string>();
    return new Set(availSlots.map(s => s.date));
  }, [availSlots]);

  // ─── Slots for selected date ───────────────────────────────────────────────
  const slotsForDate = useMemo(() => {
    if (!availSlots || !selectedDate) return [];
    return availSlots.filter(s => s.date === selectedDate && s.status === "available");
  }, [availSlots, selectedDate]);

  // ─── Price calculation ─────────────────────────────────────────────────────
  const extraAdults = Math.max(0, adults - 2);
  const extraAdultTotal = extraAdults * YHS_EXTRA_ADULT;
  const extraChildTotal = children * YHS_EXTRA_CHILD;
  const extraInfantTotal = infants * YHS_EXTRA_INFANT;
  const priceTotal = YHS_BASE + extraAdultTotal + extraChildTotal + extraInfantTotal;
  const totalGuests = adults + children + infants;

  // ─── Calendar navigation ───────────────────────────────────────────────────
  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
    setSelectedDate(null);
    setSelectedSlotId(null);
    setSelectedSlotTime(null);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
    setSelectedDate(null);
    setSelectedSlotId(null);
    setSelectedSlotTime(null);
  };

  const handleSelectDate = (dateStr: string) => {
    if (!availableDates.has(dateStr)) return;
    setSelectedDate(dateStr);
    setSelectedSlotId(null);
    setSelectedSlotTime(null);
  };

  // ─── Mutations ─────────────────────────────────────────────────────────────
  const createCheckoutSession = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    },
    onError: (err) => {
      setIsRedirectingToPayment(false);
      toast.error(t("experience.checkoutError"), { description: err.message });
    },
  });

  const sendInquiry = trpc.inquiry.send.useMutation({
    onSuccess: () => {
      toast.success(t("experience.inquirySent"));
      setShowInquiry(false);
      setInquiryDates("");
      setInquiryMessage("");
    },
    onError: (err) => toast.error(t("experience.inquiryError") + " " + err.message),
  });

  const handleSendInquiry = () => {
    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
     if (!inquiryDates.trim()) { toast.error(t("experience.inquiryDatesRequired")); return; }
    if (inquiryMessage.trim().length < 10) { toast.error(t("experience.inquiryMessageMin")); return; }
    sendInquiry.mutate({
      experienceId: Number(id),
      preferredDates: inquiryDates,
      guestCount: inquiryCount,
      message: inquiryMessage,
    });
  };

  const createBooking = trpc.booking.create.useMutation({
    onSuccess: (data) => {
      toast.success(t("experience.bookingAccepted"));
      setIsRedirectingToPayment(true);
      createCheckoutSession.mutate({
        bookingId: data.id,
        currency,
        successPath: "/payment/success",
        cancelPath: "/payment/cancel",
      });
    },
    onError: (err) => toast.error(err.message),
  });

  const handleBook = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    if (!selectedDate || !selectedSlotId || !selectedSlotTime) {
      toast.error(t("experience.selectDateAndTime"));
      return;
    }
    if (adults < 2) {
      toast.error(t("experience.minAdults"));
      return;
    }
    const startTime = new Date(`${selectedDate}T${selectedSlotTime}:00`).toISOString();
    createBooking.mutate({
      experienceId: exp!.id,
      startTime,
      adultsCount: adults,
      childrenCount: children,
      infantsCount: infants,
      currency,
      dietaryRestrictions: dietary,
      specialRequests: special,
      pickupStation: pickupStation || undefined,
    });
  };

  // ─── SEO: document.title + Event JSON-LD ──────────────────────────────────
  // NOTE: useEffect は Hooks のルール上 early return より前に置く必要がある
  const title = exp ? (i18n.language.startsWith("ja") && exp.titleJa ? exp.titleJa : exp.titleEn) : "";
  const description = exp ? (i18n.language.startsWith("ja") && exp.descriptionJa ? exp.descriptionJa : exp.descriptionEn) : "";
  const images = exp?.imageUrls ? JSON.parse(exp.imageUrls) as string[] : [];

  useEffect(() => {
    if (!exp) return;
    document.title = `${title} | YumHomeStay`;
    const scriptId = "jsonld-experience";
    let el = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement("script");
      el.id = scriptId;
      el.type = "application/ld+json";
      document.head.appendChild(el);
    }
    const jsonLd: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "Event",
      name: title,
      description: description || "",
      image: images[0] || "",
      url: `https://yumhomestay.com/experiences/${exp.id}`,
      organizer: { "@type": "Organization", name: "YumHomeStay", url: "https://yumhomestay.com" },
      offers: {
        "@type": "Offer",
        price: String(exp.priceJpy ?? 55000),
        priceCurrency: "JPY",
        availability: "https://schema.org/InStock",
        url: `https://yumhomestay.com/experiences/${exp.id}`
      },
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: {
        "@type": "Place",
        name: "Japan",
        address: { "@type": "PostalAddress", addressCountry: "JP" }
      }
    };
    if (ratingSummary && ratingSummary.count > 0) {
      jsonLd.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: ratingSummary.avgRating,
        reviewCount: ratingSummary.count,
        bestRating: 5,
        worstRating: 1
      };
    }
    el.textContent = JSON.stringify(jsonLd);
    return () => { document.getElementById(scriptId)?.remove(); };
  }, [exp, title, description, images, ratingSummary]);

  // ─── Loading / not found ───────────────────────────────────────────────────
  if (isLoading) {
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
  if (!exp) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">{t("experience.notFound")}</p>
        </div>
        <Footer />
      </div>
    );
  }

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);
  const todayStr = today.toISOString().slice(0, 10);

  const canBook = !!selectedDate && !!selectedSlotId && isAuthenticated;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left: Experience details ─────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image */}
            <div className="aspect-video bg-muted rounded-xl overflow-hidden">
              {images[0] ? (
                <img src={images[0]} alt={title} className="w-full h-full object-cover" fetchPriority="high" decoding="async" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/20">
                  <ChefHat className="w-20 h-20 text-primary/30" />
                </div>
              )}
            </div>

            {/* Title & badges */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">{title}</h1>
              {/* YHS固有バッジ */}
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50">
                  {t("badge.stationPickup")}
                </Badge>
                <Badge className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50">
                  {t("badge.ingredientsIncluded")}
                </Badge>
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50">
                  {t("badge.minGuests")}
                </Badge>
                <Badge className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-50">
                  {t("badge.duration4h")}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {exp.cuisineType && <Badge variant="secondary">{exp.cuisineType}</Badge>}
                {exp.experienceType && <Badge variant="outline">{exp.experienceType}</Badge>}
                <Badge variant="outline">
                  <Clock className="w-3 h-3 mr-1" />
                  {t("experience.minutes", { count: exp.durationMinutes })}
                </Badge>
                <Badge variant="outline">
                  <Users className="w-3 h-3 mr-1" />
                  {t("experience.maxGuests")} {exp.maxGuests}{t("experience.guests")}
                </Badge>
              </div>
              <p className="text-foreground/80 leading-relaxed">{description}</p>
            </div>

            {/* Pricing guide */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <span>{t("experience.pricingTitle")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="py-2 font-medium">{t("experience.basePackage")}</td>
                      <td className="py-2 text-right font-bold text-primary">¥55,000</td>
                      <td className="py-2 pl-4 text-muted-foreground text-xs">{t("experience.basePackageDesc")}</td>
                    </tr>
                    <tr>
                      <td className="py-2">{t("experience.extraAdult")}</td>
                      <td className="py-2 text-right">+¥22,000</td>
                      <td className="py-2 pl-4 text-muted-foreground text-xs">{t("experience.extraAdultDesc")}</td>
                    </tr>
                    <tr>
                      <td className="py-2">{t("experience.childAge")}</td>
                      <td className="py-2 text-right">+¥11,000</td>
                      <td className="py-2 pl-4 text-muted-foreground text-xs">{t("experience.perPerson")}</td>
                    </tr>
                    <tr>
                      <td className="py-2">{t("experience.infantAge")}</td>
                      <td className="py-2 text-right">+¥5,500</td>
                      <td className="py-2 pl-4 text-muted-foreground text-xs">{t("experience.perPerson")}</td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Cancellation policy */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t("experience.cancellation")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={exp.cancellationPolicy === "flexible" ? "default" : exp.cancellationPolicy === "moderate" ? "secondary" : "destructive"}>
                  {t(`experience.${exp.cancellationPolicy}`)}
                </Badge>
              </CardContent>
            </Card>

            {/* Reviews */}
            <ReviewSection experienceId={exp.id} lang={i18n.language.startsWith("ja") ? "ja" : "en"} />
          </div>

          {/* ── Right: Booking form ──────────────────────────────────────── */}
          <div id="booking-form">
            <div className="sticky top-20 space-y-4">

              {/* ── Step 1: Calendar ──────────────────────────────────────── */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    <span>Step 1 — {t("experience.step1")}</span>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{t("experience.calendarHint")}</p>
                </CardHeader>
                <CardContent className="px-3">
                  {/* Month navigation */}
                  <div className="flex items-center justify-between mb-2">
                    <button
                      type="button"
                      onClick={prevMonth}
                      disabled={calYear === today.getFullYear() && calMonth === today.getMonth()}
                      className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-semibold">{new Date(calYear, calMonth).toLocaleDateString(i18n.language, { year: 'numeric', month: 'long' })}</span>
                    <button type="button" onClick={nextMonth} className="p-1 rounded hover:bg-muted transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Day headers */}
                  <div className="grid grid-cols-7 mb-1">
                    {Array.from({ length: 7 }, (_, i) => {
                      const d = new Date(2024, 0, i); // Sunday=0
                      return (
                        <div key={i} className={`text-center text-xs font-medium py-1 ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-muted-foreground"}`}>
                          {d.toLocaleDateString(i18n.language, { weekday: 'narrow' })}
                        </div>
                      );
                    })}
                  </div>

                  {/* Calendar grid */}
                  {slotsLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-7 gap-0.5">
                      {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dateStr = toDateStr(calYear, calMonth, day);
                        const isAvail = availableDates.has(dateStr);
                        const isPast = dateStr < todayStr;
                        const isSelected = selectedDate === dateStr;
                        const isToday = dateStr === todayStr;
                        const dow = new Date(calYear, calMonth, day).getDay();

                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => handleSelectDate(dateStr)}
                            disabled={!isAvail || isPast}
                            className={[
                              "relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm font-medium transition-all",
                              isSelected
                                ? "bg-primary text-primary-foreground shadow-md scale-105"
                                : isAvail && !isPast
                                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
                                  : isPast
                                    ? "text-muted-foreground/40 cursor-not-allowed"
                                    : "text-muted-foreground/60 cursor-not-allowed",
                              isToday && !isSelected ? "ring-2 ring-primary ring-offset-1" : "",
                              dow === 0 && !isSelected ? "text-red-500" : "",
                              dow === 6 && !isSelected && !isAvail ? "text-blue-400" : "",
                            ].join(" ")}
                          >
                            <span>{day}</span>
                            {isAvail && !isPast && !isSelected && (
                              <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* No slots message */}
                  {!slotsLoading && availableDates.size === 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-amber-700">
                          {t("experience.noSlotsMonth")}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2 border-amber-300 text-amber-700 hover:bg-amber-50"
                        onClick={() => setShowInquiry(true)}
                      >
                        <MessageCircle className="w-4 h-4" />
                        {t("experience.inquireHost")}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ── Step 2: Time slot selection ───────────────────────────── */}
              {selectedDate && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>Step 2 — {t("experience.step2")}</span>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {t("experience.availableSlots", { date: selectedDate?.replace(/-/g, "/") })}
                    </p>
                  </CardHeader>
                  <CardContent>
                    {slotsForDate.length === 0 ? (
                      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-amber-700">{t("experience.noSlotsDate")}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2">
                        {slotsForDate.map((slot) => (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => {
                              setSelectedSlotId(slot.id);
                              setSelectedSlotTime(slot.startTime);
                            }}
                            className={[
                              "flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left",
                              selectedSlotId === slot.id
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-border hover:border-primary/50 hover:bg-muted/50",
                            ].join(" ")}
                          >
                            <div className="flex items-center gap-3">
                              <Clock className="w-4 h-4 text-primary" />
                              <div>
                                <p className="font-semibold text-sm">{slot.startTime} 〜 {slot.endTime}</p>
                                <p className="text-xs text-muted-foreground">{t("experience.programDesc")}</p>
                              </div>
                            </div>
                            {selectedSlotId === slot.id && (
                              <CheckCircle2 className="w-5 h-5 text-primary" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* ── Step 3: Guest count ───────────────────────────────────── */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span>Step 3 — {t("experience.step3")}</span>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{t("experience.minAdultsHint")}</p>
                </CardHeader>
                <CardContent className="divide-y divide-border">
                  <GuestCounter
                    label={t("booking.adults")} sub={t("experience.adultsBase")}
                    value={adults} min={2} max={exp.maxGuests}
                    onChange={setAdults}
                  />
                  <GuestCounter
                    label={t("booking.children")} sub={t("experience.childrenAge")}
                    value={children} min={0} max={Math.max(0, exp.maxGuests - adults)}
                    onChange={setChildren}
                  />
                  <GuestCounter
                    label={t("booking.infants")} sub={t("experience.infantsAge")}
                    value={infants} min={0} max={Math.max(0, exp.maxGuests - adults - children)}
                    onChange={setInfants}
                  />
                </CardContent>
              </Card>

              {/* ── Step 4: Details ───────────────────────────────────────── */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Step 4 — {t("experience.step4")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Pickup station */}
                  <div>
                    <Label className="text-sm font-medium">{t("experience.pickupStation")}</Label>
                    <input
                      type="text"
                      placeholder={t("experience.pickupStationPlaceholder")}
                      value={pickupStation}
                      onChange={(e) => setPickupStation(e.target.value)}
                      className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <p className="text-xs text-muted-foreground mt-1">{t("experience.pickupHint")}</p>
                  </div>

                  {/* Currency */}
                  <div>
                    <Label className="text-sm font-medium">{t("booking.currency")}</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(currencyData?.currencies ?? ["JPY"]).map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Dietary */}
                  <div>
                    <Label className="text-sm font-medium">{t("booking.dietary")}</Label>
                    <Textarea
                      placeholder={t("experience.dietaryPlaceholder")}
                      value={dietary}
                      onChange={(e) => setDietary(e.target.value)}
                      rows={2}
                      className="mt-1"
                    />
                  </div>

                  {/* Special requests */}
                  <div>
                    <Label className="text-sm font-medium">{t("booking.special")}</Label>
                    <Textarea
                      placeholder={t("experience.specialRequestsPlaceholder")}
                      value={special}
                      onChange={(e) => setSpecial(e.target.value)}
                      rows={2}
                      className="mt-1"
                    />
                  </div>

                  {/* ビデオ面談の案内（ホームステイのみ・申込確定後に実施） */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                      <span className="text-xl">📹</span>
                      <div>
                        <p className="text-sm font-semibold text-amber-800">{t("experience.videoCallTitle")}</p>
                        <p className="text-xs text-amber-700 mt-0.5">{t("experience.videoCallDesc")}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ── Price summary + CTA ───────────────────────────────────── */}
              <Card className="border-primary/30">
                <CardContent className="pt-4 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">{t("experience.priceSummary")}</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>{t("experience.basePackage")}</span>
                      <span>¥{YHS_BASE.toLocaleString()}</span>
                    </div>
                    {extraAdults > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>{t("experience.extraAdult")} {extraAdults}{t("common.person")} × ¥{YHS_EXTRA_ADULT.toLocaleString()}</span>
                        <span>¥{extraAdultTotal.toLocaleString()}</span>
                      </div>
                    )}
                    {children > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>{t("booking.children")} {children}{t("common.person")} × ¥{YHS_EXTRA_CHILD.toLocaleString()}</span>
                        <span>¥{extraChildTotal.toLocaleString()}</span>
                      </div>
                    )}
                    {infants > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>{t("booking.infants")} {infants}{t("common.person")} × ¥{YHS_EXTRA_INFANT.toLocaleString()}</span>
                        <span>¥{extraInfantTotal.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base border-t pt-2 mt-1">
                      <span>{t("booking.total")}({totalGuests}{t("common.person")})</span>
                      <span className="text-primary">¥{priceTotal.toLocaleString()}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">✔ {t("experience.allIncluded")}</p>

                  {/* Booking status summary */}
                  {selectedDate && selectedSlotId && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-700 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{selectedDate.replace(/-/g, "/")} {selectedSlotTime} / {totalGuests}{t("common.person")}</span>
                    </div>
                  )}

                  <Button
                    className="w-full mt-2"
                    size="lg"
                    onClick={handleBook}
                    disabled={!canBook || createBooking.isPending || isRedirectingToPayment}
                  >
                    {isRedirectingToPayment ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        {t("experience.redirectingToPayment")}
                      </span>
                    ) : createBooking.isPending ? (
                      t("common.processing")
                    ) : !isAuthenticated ? (
                      t("experience.loginToBook")
                    ) : !selectedDate || !selectedSlotId ? (
                      t("experience.selectDateAndTime")
                    ) : (
                      t("experience.bookAndPay")
                    )}
                  </Button>

                  {!isAuthenticated && (
                    <p className="text-xs text-muted-foreground text-center">
                      {t("experience.loginRequired")}
                    </p>
                  )}
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile floating CTA ─────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t border-border p-3 flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setShowInquiry(true)}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          {t("experience.inquiryButton")}
        </Button>
        <Button
          className="flex-1"
          onClick={() => {
            const el = document.getElementById("booking-form");
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          <CalendarDays className="w-4 h-4 mr-2" />
          {t("experience.bookNow") || "予約する"}
        </Button>
      </div>
      {/* モバイルCTA分の余白 */}
      <div className="lg:hidden h-16" />

      <Footer />

      {/* ── Inquiry Dialog ────────────────────────────────────────────── */}
      <Dialog open={showInquiry} onOpenChange={setShowInquiry}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              {t("experience.inquiryTitle")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              {t("experience.inquiryDesc")}
            </p>

            <div>
              <Label className="text-sm font-medium">{t("experience.inquiryDates")} <span className="text-red-500">*</span></Label>
              <input
                type="text"
                placeholder={t("experience.inquiryDatesPlaceholder")}
                value={inquiryDates}
                onChange={(e) => setInquiryDates(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">{t("experience.inquiryGuestCount")}</Label>
              <div className="flex items-center gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => setInquiryCount(c => Math.max(1, c - 1))}
                  className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-lg font-medium hover:bg-muted transition-colors"
                >−</button>
                <span className="w-8 text-center font-semibold">{inquiryCount}</span>
                <button
                  type="button"
                  onClick={() => setInquiryCount(c => Math.min(20, c + 1))}
                  className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-lg font-medium hover:bg-muted transition-colors"
                >＋</button>
                <span className="text-sm text-muted-foreground">{t("common.person")}</span>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">{t("experience.inquiryMessage")} <span className="text-red-500">*</span></Label>
              <Textarea
                placeholder={t("experience.inquiryMessagePlaceholder")}
                value={inquiryMessage}
                onChange={(e) => setInquiryMessage(e.target.value)}
                rows={4}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">{inquiryMessage.length}/2000</p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowInquiry(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSendInquiry}
              disabled={sendInquiry.isPending}
              className="gap-2"
            >
              {sendInquiry.isPending ? (
                <>
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  {t("common.sending")}
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4" />
                  {t("common.send")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
