import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { PartnerFormWizard, type WizardStep } from "@/components/PartnerFormWizard";
import { PrefectureMapSelector } from "@/components/PrefectureMapSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import {
  CheckCircle,
  Clock,
  ShieldCheck,
  Star,
  Users,
  AlertCircle,
  CalendarDays,
  ChevronRight,
  ChevronLeft,
  CreditCard,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";

const LANGUAGES = [
  { code: "ja", label: "日本語" },
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
  { code: "ko", label: "한국어" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
];

export default function HostRegister() {
  const { t } = useTranslation();
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);

  const DIETARY_OPTIONS = [
    { value: "halal", label: t("hostRegister.dietaryHalal") },
    { value: "vegetarian", label: t("hostRegister.dietaryVegetarian") },
    { value: "vegan", label: t("hostRegister.dietaryVegan") },
    { value: "gluten_free", label: t("hostRegister.dietaryGlutenFree") },
    { value: "nut_allergy", label: t("hostRegister.dietaryNutAllergy") },
    { value: "dairy_free", label: t("hostRegister.dietaryDairyFree") },
  ];

  const STEPS: WizardStep[] = [
    { id: 1, title: t("hostRegister.step1Title"), desc: t("hostRegister.step1Desc") },
    { id: 2, title: t("hostRegister.step2Title"), desc: t("hostRegister.step2Desc") },
    { id: 3, title: t("hostRegister.step3Title"), desc: t("hostRegister.step3Desc") },
    { id: 4, title: t("hostRegister.step4Title"), desc: t("hostRegister.step4Desc") },
    { id: 5, title: t("hostRegister.step5Title"), desc: t("hostRegister.step5Desc") },
  ];

  const NAVIGATOR_MESSAGES = [
    { step: 1, message: "はじめまして！まずはあなたのプロフィールを教えてください。ゲストが最初に見る情報なので、心を込めて書いてみてください✨" },
    { step: 2, message: "いい感じです！次はファミリー構成と食事対応について教えてください。ゲストの安心につながります😊" },
    { step: 3, message: "もう少しです！大切な確認事項です。各項目をよく読んでからチェックしてください。" },
    { step: 4, message: "いよいよ最後のステップ！ZOOM面接の希望日時を教えてください。当社からご連絡します💬" },
    { step: 5, message: "登録アプリケーションが完了しました！最後に登録料のお支払いをお願いします。お支払い後、ZOOM面接の日程を調整します✨" },
  ];

  // sessionStorageから引き継ぎデータを読み込む
  const savedHostLead = (() => {
    try {
      const raw = sessionStorage.getItem("yhs_host_lead");
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  })();

  // Step 1: Basic profile
  const [bioEn, setBioEn] = useState("");
  const [bioJa, setBioJa] = useState("");
  const [station, setStation] = useState(savedHostLead.nearestStation ?? "");
  const [prefecture, setPrefecture] = useState(savedHostLead.prefecture ?? "");
  const [city, setCity] = useState("");
  const [selectedLangs, setSelectedLangs] = useState<string[]>(["ja", "en"]);

  // Step 2: Family & dietary
  const [familyMemberCount, setFamilyMemberCount] = useState(2);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);

  // Step 3: Required confirmations
  const [hasInsurance, setHasInsurance] = useState(false);
  const [agreedToRegistrationFee, setAgreedToRegistrationFee] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Step 4: ZOOM interview preferences
  const [interviewPref1, setInterviewPref1] = useState("");
  const [interviewPref2, setInterviewPref2] = useState("");
  const [interviewPref3, setInterviewPref3] = useState("");

  // Registration state
  const [isRegistered, setIsRegistered] = useState(false);

  const { data: myHost, refetch: refetchMyHost } = trpc.host.getMyHost.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Check URL params for payment=cancelled
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stepParam = params.get("step");
    const paymentStatus = params.get("payment");

    if (paymentStatus === "cancelled") {
      toast.error(t("hostRegister.paymentCancelled"));
    }
    if (stepParam === "payment" && myHost && !myHost.registrationFeePaid) {
      setIsRegistered(true);
      setStep(5);
    }
  }, [myHost]);

  const register = trpc.host.register.useMutation({
    onSuccess: async () => {
      toast.success(t("hostRegister.applicationReceived"));
      await refetchMyHost();
      setIsRegistered(true);
      setStep(5);
    },
    onError: (err) => toast.error(err.message),
  });

  const createCheckout = trpc.stripe.createHostRegistrationCheckout.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        toast.success(t("hostRegister.stripeRedirecting"));
        window.open(data.checkoutUrl, "_blank");
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleLang = (code: string) => {
    setSelectedLangs((prev) =>
      prev.includes(code) ? prev.filter((l) => l !== code) : [...prev, code]
    );
  };

  const toggleDietary = (value: string) => {
    setSelectedDietary((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]
    );
  };

  // Step validation
  const isStep1Valid = bioEn.length >= 10 && station && prefecture && city && selectedLangs.length > 0;
  const isStep2Valid = familyMemberCount >= 2;
  const isStep3Valid = hasInsurance && agreedToRegistrationFee && agreedToTerms;
  const isStep4Valid = interviewPref1.length > 0;

  const canProceed = () => {
    if (step === 1) return isStep1Valid;
    if (step === 2) return isStep2Valid;
    if (step === 3) return isStep3Valid;
    if (step === 4) return isStep4Valid;
    return false;
  };

  // Step 4 → 5: Register host first, then show payment step
  const handleStep4Next = () => {
    if (!isStep4Valid) return;
    if (myHost) {
      setIsRegistered(true);
      setStep(5);
      return;
    }
    register.mutate({
      bioEn,
      bioJa: bioJa || undefined,
      nearestStation: station,
      prefecture,
      city,
      languages: selectedLangs,
      familyMemberCount,
      hasInsurance,
      agreedToRegistrationFee,
      agreedToTerms,
      interviewPreference1: interviewPref1,
      interviewPreference2: interviewPref2 || undefined,
      interviewPreference3: interviewPref3 || undefined,
      dietaryAccommodations: selectedDietary.length > 0 ? selectedDietary : undefined,
    });
  };

  const handlePayment = () => {
    createCheckout.mutate({
      successPath: "/host/register/payment/success",
      cancelPath: "/host/register",
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
            <p className="text-muted-foreground mb-4">{t("hostRegister.loginRequired")}</p>
            <a href={getLoginUrl()}>
              <Button>{t("nav.login")}</Button>
            </a>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Already fully registered and paid
  if (myHost?.registrationFeePaid) {
    const statusMap: Record<string, { label: string; color: "default" | "secondary" | "destructive" | "outline"; desc: string }> = {
      pending: { label: t("hostRegister.statusPending"), color: "secondary", desc: t("hostRegister.statusPendingDesc") },
      interview: { label: t("hostRegister.statusInterview"), color: "default", desc: t("hostRegister.statusInterviewDesc") },
      approved: { label: t("hostRegister.statusApproved"), color: "default", desc: t("hostRegister.statusApprovedDesc") },
      rejected: { label: t("hostRegister.statusRejected"), color: "destructive", desc: t("hostRegister.statusRejectedDesc") },
      suspended: { label: t("hostRegister.statusSuspended"), color: "destructive", desc: t("hostRegister.statusSuspendedDesc") },
    };
    const status = statusMap[myHost.approvalStatus] ?? { label: myHost.approvalStatus, color: "outline" as const, desc: "" };
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">{t("hostRegister.alreadyRegistered")}</h2>
            <div className="flex justify-center mb-3">
              <Badge variant={status.color}>{status.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-6">{status.desc}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate("/host/dashboard")}>{t("hostRegister.goToDashboard")}</Button>
              {myHost.approvalStatus === "approved" && (
                <Button variant="outline" onClick={() => navigate("/host/calendar")}>{t("hostRegister.registerAvailability")}</Button>
              )}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Registered but not paid yet → show payment step
  if (myHost && !myHost.registrationFeePaid && !isRegistered) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <CreditCard className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">{t("hostRegister.paymentRequired")}</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {t("hostRegister.paymentRequiredDesc")}
            </p>
            <Button onClick={() => { setIsRegistered(true); setStep(5); }} size="lg">
              {t("hostRegister.payNow")}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 to-accent/10 py-12">
        <div className="container max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            {t("host.becomeHost")}
          </h1>
          <p className="text-muted-foreground text-lg">
            {t("hostRegister.heroSubtitle")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
            {[
              { icon: <Star className="w-6 h-6 text-primary" />, title: t("host.benefit1Title"), desc: t("host.benefit1Desc") },
              { icon: <Clock className="w-6 h-6 text-primary" />, title: t("host.benefit2Title"), desc: t("host.benefit2Desc") },
              { icon: <ShieldCheck className="w-6 h-6 text-primary" />, title: t("host.benefit3Title"), desc: t("host.benefit3Desc") },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-sm">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Multi-step form */}
      <div className="container max-w-5xl py-10">
        <Card className="overflow-hidden shadow-xl">
          <PartnerFormWizard
            currentStep={step}
            steps={STEPS}
            navigatorMessages={NAVIGATOR_MESSAGES}
            theme="green"
            navigatorTitle="YumHomeStayナビゲーター"
          >
          <div className="space-y-5">
            {/* ── Step 1: Basic Profile ── */}
            {step === 1 && (
              <>
                <div>
                  <Label>
                    {t("hostRegister.bioEnLabel")}<span className="text-destructive ml-1">*</span>
                  </Label>
                  <Textarea
                    placeholder={t("hostRegister.bioEnPlaceholder")}
                    value={bioEn}
                    onChange={(e) => setBioEn(e.target.value)}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{t("hostRegister.bioEnHint")}</p>
                  {bioEn.length > 0 && bioEn.length < 10 && (
                    <p className="text-xs text-destructive mt-1">{t("hostRegister.bioEnError", { count: 10 - bioEn.length })}</p>
                  )}
                </div>
                <div>
                  <Label>{t("hostRegister.bioJaLabel")}</Label>
                  <Textarea
                    placeholder={t("hostRegister.bioJaPlaceholder")}
                    value={bioJa}
                    onChange={(e) => setBioJa(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <PrefectureMapSelector
                      value={prefecture}
                      onChange={setPrefecture}
                      label={t("hostRegister.prefectureLabel")}
                      required
                      defaultShowMap={true}
                    />
                  </div>
                  <div>
                    <Label>{t("hostRegister.cityLabel")}<span className="text-destructive ml-1">*</span></Label>
                    <Input placeholder={t("hostRegister.cityPlaceholder")} value={city} onChange={(e) => setCity(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>{t("hostRegister.stationLabel")}<span className="text-destructive ml-1">*</span></Label>
                  <Input placeholder={t("hostRegister.stationPlaceholder")} value={station} onChange={(e) => setStation(e.target.value)} />
                  <p className="text-xs text-muted-foreground mt-1">{t("hostRegister.stationHint")}</p>
                </div>
                <div>
                  <Label>{t("hostRegister.languagesLabel")}<span className="text-destructive ml-1">*</span></Label>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {LANGUAGES.map((lang) => (
                      <div key={lang.code} className="flex items-center gap-2">
                        <Checkbox
                          id={`lang-${lang.code}`}
                          checked={selectedLangs.includes(lang.code)}
                          onCheckedChange={() => toggleLang(lang.code)}
                        />
                        <label htmlFor={`lang-${lang.code}`} className="text-sm cursor-pointer">{lang.label}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── Step 2: Family & Dietary ── */}
            {step === 2 && (
              <>
                <div>
                  <Label className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    {t("hostRegister.familyCountLabel")}<span className="text-destructive ml-1">*</span>
                  </Label>
                  <Input
                    type="number"
                    min={2}
                    max={20}
                    value={familyMemberCount}
                    onChange={(e) => setFamilyMemberCount(Math.max(2, Number(e.target.value)))}
                    className="mt-1"
                  />
                  {familyMemberCount < 2 ? (
                    <p className="text-xs text-destructive mt-1">{t("hostRegister.familyCountMin")}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">{t("hostRegister.familyCountHint")}</p>
                  )}
                </div>
                <div>
                  <Label>{t("hostRegister.dietaryLabel")}</Label>
                  <p className="text-xs text-muted-foreground mb-2">{t("hostRegister.dietaryHint")}</p>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {DIETARY_OPTIONS.map((opt) => (
                      <div key={opt.value} className="flex items-center gap-2">
                        <Checkbox
                          id={`diet-${opt.value}`}
                          checked={selectedDietary.includes(opt.value)}
                          onCheckedChange={() => toggleDietary(opt.value)}
                        />
                        <label htmlFor={`diet-${opt.value}`} className="text-sm cursor-pointer">{opt.label}</label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                  <p className="font-semibold">{t("hostRegister.yhsConditionsTitle")}</p>
                  <ul className="space-y-1 text-muted-foreground text-xs">
                    <li>✓ {t("hostRegister.yhsCondition1")}</li>
                    <li>✓ {t("hostRegister.yhsCondition2")}</li>
                    <li>✓ {t("hostRegister.yhsCondition3")}</li>
                    <li>✓ {t("hostRegister.yhsCondition4")}</li>
                    <li>✓ {t("hostRegister.yhsCondition5")}</li>
                  </ul>
                </div>
              </>
            )}

            {/* ── Step 3: Required Confirmations ── */}
            {step === 3 && (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-semibold mb-1">{t("hostRegister.step3Warning")}</p>
                    <p>{t("hostRegister.step3WarningDesc")}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="insurance"
                        checked={hasInsurance}
                        onCheckedChange={(v) => setHasInsurance(v === true)}
                        className="mt-0.5"
                      />
                      <div>
                        <label htmlFor="insurance" className="font-semibold text-sm cursor-pointer">
                          {t("hostRegister.insuranceLabel")}
                          <span className="text-destructive ml-1">*</span>
                        </label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("hostRegister.insuranceDesc")}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="reg-fee"
                        checked={agreedToRegistrationFee}
                        onCheckedChange={(v) => setAgreedToRegistrationFee(v === true)}
                        className="mt-0.5"
                      />
                      <div>
                        <label htmlFor="reg-fee" className="font-semibold text-sm cursor-pointer">
                          {t("hostRegister.regFeeLabel")}
                          <span className="text-destructive ml-1">*</span>
                        </label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("hostRegister.regFeeDesc")}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="terms"
                        checked={agreedToTerms}
                        onCheckedChange={(v) => setAgreedToTerms(v === true)}
                        className="mt-0.5"
                      />
                      <div>
                        <label htmlFor="terms" className="font-semibold text-sm cursor-pointer">
                          {t("hostRegister.termsLabel")}
                          <span className="text-destructive ml-1">*</span>
                        </label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("hostRegister.termsDesc")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── Step 4: ZOOM Interview ── */}
            {step === 4 && (
              <>
                <div className="flex items-start gap-3 bg-primary/5 rounded-lg p-4">
                  <CalendarDays className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold mb-1">{t("hostRegister.zoomTitle")}</p>
                    <p className="text-muted-foreground text-xs">
                      {t("hostRegister.zoomDesc")}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>{t("hostRegister.pref1Label")}<span className="text-destructive ml-1">*</span></Label>
                    <Input
                      type="datetime-local"
                      value={interviewPref1}
                      onChange={(e) => setInterviewPref1(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">{t("hostRegister.prefHint")}</p>
                  </div>
                  <div>
                    <Label>{t("hostRegister.pref2Label")}</Label>
                    <Input
                      type="datetime-local"
                      value={interviewPref2}
                      onChange={(e) => setInterviewPref2(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                  <div>
                    <Label>{t("hostRegister.pref3Label")}</Label>
                    <Input
                      type="datetime-local"
                      value={interviewPref3}
                      onChange={(e) => setInterviewPref3(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground">{t("hostRegister.nextStepsTitle")}</p>
                  <p>{t("hostRegister.nextStepsDesc")}</p>
                  <p>{t("hostRegister.nextStepsDesc2")}</p>
                </div>
              </>
            )}

            {/* ── Step 5: Payment ── */}
            {step === 5 && (
              <>
                <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-800">
                    <p className="font-semibold mb-1">{t("hostRegister.applicationReceivedTitle")}</p>
                    <p>{t("hostRegister.applicationReceivedDesc")}</p>
                  </div>
                </div>

                <div className="border rounded-xl p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <CreditCard className="w-6 h-6 text-primary" />
                    <h3 className="font-bold text-lg">{t("hostRegister.paymentTitle")}</h3>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("hostRegister.paymentItemLabel")}</span>
                      <span className="font-semibold">¥5,000</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("hostRegister.paymentBreakdown")}</span>
                      <span className="text-xs text-muted-foreground text-right">{t("hostRegister.paymentBreakdownDesc")}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>{t("hostRegister.paymentTotal")}</span>
                      <span className="text-primary text-lg">¥5,000</span>
                    </div>
                  </div>

                  <Button
                    onClick={handlePayment}
                    disabled={createCheckout.isPending}
                    size="lg"
                    className="w-full"
                  >
                    {createCheckout.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t("hostRegister.connectingStripe")}
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        {t("hostRegister.payWithStripe")}
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    {t("hostRegister.stripeSecureNote")}
                  </p>
                  <p className="text-xs text-muted-foreground text-center">
                    {t("hostRegister.refundNote")}
                  </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground">{t("hostRegister.afterPaymentTitle")}</p>
                  <p>{t("hostRegister.afterPayment1")}</p>
                  <p>{t("hostRegister.afterPayment2")}</p>
                  <p>{t("hostRegister.afterPayment3")}</p>
                  <p>{t("hostRegister.afterPayment4")}</p>
                </div>
              </>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between pt-2 border-t">
              {step > 1 && step < 5 ? (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  {t("hostRegister.prev")}
                </Button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                  {t("hostRegister.next")}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : step === 4 ? (
                <Button
                  onClick={handleStep4Next}
                  disabled={register.isPending || !isStep4Valid}
                  className="min-w-32"
                >
                  {register.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      {t("hostRegister.submitting")}
                    </>
                  ) : (
                    <>
                      {t("hostRegister.nextToPayment")}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              ) : null}
            </div>
          </div>
          </PartnerFormWizard>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
