/**
 * GuestApply.tsx — ゲスト申込フォーム（多言語対応）
 */
import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Users, Calendar, Globe, Utensils, MessageSquare,
  CheckCircle2, ChevronRight, ArrowLeft, Loader2, MapPin,
  LogIn, UserCheck, Info,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { YHS_BASE_PRICE_JPY, YHS_EXTRA_ADULT_JPY, YHS_EXTRA_CHILD_JPY, YHS_EXTRA_INFANT_JPY, calcTotalSalesJpy } from "../../../shared/pricing";

const schema = z.object({
  adultsCount: z.coerce.number().int().min(2).max(10),
  childrenCount: z.coerce.number().int().min(0).max(10).default(0),
  infantsCount: z.coerce.number().int().min(0).max(5).default(0),
  preferredHostId: z.coerce.number().int().optional(),
  preferredArea: z.string().optional(),
  preferredDateFrom: z.string().optional(),
  preferredDateTo: z.string().optional(),
  originCountry: z.string().optional(),
  dietaryRestrictions: z.string().optional(),
  specialRequests: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const AREAS_JA = ["東京（都内）", "東京近郊（神奈川・埼玉・千葉）", "京都", "大阪", "その他"];
const AREAS_EN = ["Tokyo (City)", "Tokyo Area (Kanagawa/Saitama/Chiba)", "Kyoto", "Osaka", "Other"];
const AREAS_ZH = ["东京（市区）", "东京周边（神奈川/埼玉/千叶）", "京都", "大阪", "其他"];
const AREAS_KO = ["도쿄 (시내)", "도쿄 근교 (가나가와/사이타마/치바)", "교토", "오사카", "기타"];

const COUNTRIES = ["USA", "UK", "Australia", "Canada", "France", "Germany", "China", "Korea", "Japan", "Other"];

const LANGUAGE_TO_COUNTRY: Record<string, string> = {
  en: "USA", "en-US": "USA", "en-GB": "UK", "en-AU": "Australia", "en-CA": "Canada",
  fr: "France", de: "Germany", zh: "China", "zh-CN": "China", "zh-TW": "China",
  ko: "Korea", ja: "Japan",
};

function guessCountryFromLanguage(lang?: string | null): string | undefined {
  if (!lang) return undefined;
  if (LANGUAGE_TO_COUNTRY[lang]) return LANGUAGE_TO_COUNTRY[lang];
  const prefix = lang.split("-")[0];
  return LANGUAGE_TO_COUNTRY[prefix];
}

export default function GuestApply() {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [autoFilledCountry, setAutoFilledCountry] = useState(false);

  // URLパラメータからhostIdを取得（/apply?hostId=123）
  const preferredHostIdFromUrl = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const val = params.get("hostId");
    return val ? parseInt(val, 10) : undefined;
  }, []);

  const lang = i18n.language;
  const AREAS = lang.startsWith("zh") ? AREAS_ZH
    : lang.startsWith("ko") ? AREAS_KO
    : lang.startsWith("ja") ? AREAS_JA
    : AREAS_EN;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { adultsCount: 2, childrenCount: 0, infantsCount: 0, preferredHostId: preferredHostIdFromUrl },
  });

  useEffect(() => {
    if (!user || autoFilledCountry) return;
    const guessedCountry = guessCountryFromLanguage(user.preferredLanguage);
    if (guessedCountry && !watch("originCountry")) {
      setValue("originCountry", guessedCountry);
      setAutoFilledCountry(true);
    }
  }, [user, autoFilledCountry, setValue, watch]);

  const adultsCount = watch("adultsCount") ?? 2;
  const childrenCount = watch("childrenCount") ?? 0;
  const infantsCount = watch("infantsCount") ?? 0;
  const extraAdults = Math.max(0, Number(adultsCount) - 2);
  const totalJpy = calcTotalSalesJpy(Number(adultsCount), Number(childrenCount), Number(infantsCount));

  const submitMutation = trpc.inquiry.submit.useMutation({
    onSuccess: () => { setSubmitted(true); },
    onError: (err) => { toast.error(err.message); },
  });

  const onSubmit = (data: FormData) => {
    submitMutation.mutate({
      ...data,
      preferredHostId: data.preferredHostId || preferredHostIdFromUrl,
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-4">
            <img
              src="https://pub-b1b8e8c3a5c14f0b8e7a9b3d2c1e4f5a.r2.dev/characters/pose01_mama.png"
              alt="Mama Cook"
              className="w-32 h-32 object-contain mx-auto mb-4 animate-float"
            />
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-3">{t("apply.submitted")}</h2>
            <p className="text-muted-foreground mb-2">{t("apply.submittedDesc")}</p>
            <p className="text-muted-foreground mb-8">{t("apply.submittedDesc2")}</p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 text-left">
              <p className="text-sm font-semibold text-amber-800 mb-2">{t("apply.nextSteps")}</p>
              <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
                <li>{t("apply.nextStep1")}</li>
                <li>{t("apply.nextStep2")}</li>
                <li>{t("apply.nextStep3")}</li>
                <li>{t("apply.nextStep4")}</li>
              </ol>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" asChild>
                <Link href="/">{t("apply.backToTop")}</Link>
              </Button>
              <Button asChild>
                <Link href="/my-inquiries">{t("apply.checkStatus")}</Link>
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const steps = [
    { id: 1, label: t("apply.step1") },
    { id: 2, label: t("apply.step2") },
    { id: 3, label: t("apply.step3") },
    { id: 4, label: t("apply.step4") },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />
      <div className="container py-8 max-w-2xl">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t("apply.backToTop")}
          </Link>
          <h1 className="text-2xl font-bold">{t("apply.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("apply.subtitle")}</p>
        </div>

        {!isAuthenticated && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
            <LogIn className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-800">{t("apply.loginBenefitTitle")}</p>
              <p className="text-xs text-blue-700 mt-0.5">{t("apply.loginBenefitDesc")}</p>
            </div>
            <Button size="sm" variant="outline" asChild className="shrink-0 border-blue-300 text-blue-700 hover:bg-blue-100">
              <a href={getLoginUrl()}>
                <LogIn className="w-3.5 h-3.5 mr-1.5" />
                {t("nav.login")}
              </a>
            </Button>
          </div>
        )}

        {isAuthenticated && user && (
          <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-green-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-green-800">
                {t("apply.applyingAs", { name: user.name ?? t("apply.loggedIn") })}
              </p>
              {user.email && (
                <p className="text-xs text-green-700 truncate">
                  {t("apply.confirmEmailTo")}: {user.email}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ステップインジケーター */}
        <div className="mb-8">
          <div className="flex items-center gap-1">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center gap-1 flex-1">
                <div className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold shrink-0 transition-all ${
                  step > s.id ? "bg-green-500 text-white shadow-sm" :
                  step === s.id ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : s.id}
                </div>
                {i < steps.length - 1 && (
                  <div className={`h-1 flex-1 rounded-full transition-all ${
                    step > s.id ? "bg-green-500" : "bg-muted"
                  }`} />
                )}
              </div>
            ))}
          </div>
          {/* アクティブステップのラベルを常時表示 */}
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {t("apply.step", "ステップ")} {step} / {steps.length}
            </span>
            <span className="text-sm font-semibold text-primary">
              {steps.find((s) => s.id === step)?.label}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1: 参加人数 */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  {t("apply.step1")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{t("apply.minGuests")}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="adultsCount">{t("apply.adults")}</Label>
                    <Input id="adultsCount" type="number" min={2} max={10} {...register("adultsCount")} className="mt-1" />
                    {errors.adultsCount && (
                      <p className="text-xs text-destructive mt-1">{t("apply.adultsError")}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="childrenCount">{t("apply.children")}</Label>
                    <Input id="childrenCount" type="number" min={0} max={10} {...register("childrenCount")} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="infantsCount">{t("apply.infants")}</Label>
                    <Input id="infantsCount" type="number" min={0} max={5} {...register("infantsCount")} className="mt-1" />
                  </div>
                </div>
                {/* 料金サマリー */}
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
                    <Info className="w-4 h-4" />
                    {t("apply.priceSummary")}
                  </p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-amber-700">
                      <span>{t("apply.basePackage")}</span>
                      <span className="font-medium">¥{YHS_BASE_PRICE_JPY.toLocaleString()}</span>
                    </div>
                    {extraAdults > 0 && (
                      <div className="flex justify-between text-amber-700">
                        <span>{t("apply.extraAdult")} × {extraAdults}</span>
                        <span className="font-medium">¥{(extraAdults * YHS_EXTRA_ADULT_JPY).toLocaleString()}</span>
                      </div>
                    )}
                    {Number(childrenCount) > 0 && (
                      <div className="flex justify-between text-amber-700">
                        <span>{t("apply.extraChild")} × {childrenCount}</span>
                        <span className="font-medium">¥{(Number(childrenCount) * YHS_EXTRA_CHILD_JPY).toLocaleString()}</span>
                      </div>
                    )}
                    {Number(infantsCount) > 0 && (
                      <div className="flex justify-between text-amber-700">
                        <span>{t("apply.extraInfant")} × {infantsCount}</span>
                        <span className="font-medium">¥{(Number(infantsCount) * YHS_EXTRA_INFANT_JPY).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="border-t border-amber-300 pt-2 flex justify-between font-bold text-amber-900">
                      <span>{t("apply.totalPrice")}</span>
                      <span>¥{totalJpy.toLocaleString()}</span>
                    </div>
                  </div>
                  <p className="text-xs text-amber-600 mt-2">{t("apply.priceNote")}</p>
                </div>

                <div className="flex justify-end">
                  <Button type="button" onClick={() => setStep(2)}>
                    {t("apply.next")} <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: 希望日程・エリア */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  {t("apply.step2")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>{t("apply.preferredArea")}</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {AREAS.map((area) => (
                      <Badge
                        key={area}
                        variant={watch("preferredArea") === area ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setValue("preferredArea", area)}
                      >
                        <MapPin className="w-3 h-3 mr-1" />
                        {area}
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder={t("apply.otherArea")}
                    {...register("preferredArea")}
                    className="mt-2"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="preferredDateFrom">{t("apply.dateFrom")}</Label>
                    <Input id="preferredDateFrom" type="date" {...register("preferredDateFrom")} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="preferredDateTo">{t("apply.dateTo")}</Label>
                    <Input id="preferredDateTo" type="date" {...register("preferredDateTo")} className="mt-1" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{t("apply.multipleDates")}</p>
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> {t("apply.back")}
                  </Button>
                  <Button type="button" onClick={() => setStep(3)}>
                    {t("apply.next")} <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: ゲスト情報 */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  {t("apply.step3")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isAuthenticated && user && (
                  <div className="p-3 bg-muted/50 border border-border rounded-lg space-y-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Info className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-semibold text-muted-foreground">{t("apply.autoFilled")}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">{t("apply.name")}</Label>
                        <div className="mt-1 px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground">
                          {user.name ?? t("apply.notSet")}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">{t("apply.email")}</Label>
                        <div className="mt-1 px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground truncate">
                          {user.email ?? t("apply.notSet")}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("apply.changeProfile")} <Link href="/profile" className="text-primary underline">{t("apply.profileSettings")}</Link>
                    </p>
                  </div>
                )}

                <div>
                  <Label className="flex items-center gap-1.5">
                    {t("apply.originCountry")}
                    {autoFilledCountry && (
                      <span className="text-xs text-green-600 font-normal flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {t("apply.autoFilledLabel")}
                      </span>
                    )}
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {COUNTRIES.map((country) => (
                      <Badge
                        key={country}
                        variant={watch("originCountry") === country ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setValue("originCountry", country)}
                      >
                        {country}
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder={t("apply.otherCountry")}
                    {...register("originCountry")}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="dietaryRestrictions" className="flex items-center gap-1">
                    <Utensils className="w-4 h-4" />
                    {t("apply.dietary")}
                  </Label>
                  <Textarea
                    id="dietaryRestrictions"
                    placeholder={t("apply.dietaryPlaceholder")}
                    {...register("dietaryRestrictions")}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="specialRequests" className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    {t("apply.specialRequests")}
                  </Label>
                  <Textarea
                    id="specialRequests"
                    placeholder={t("apply.specialRequestsPlaceholder")}
                    {...register("specialRequests")}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(2)}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> {t("apply.back")}
                  </Button>
                  <Button type="button" onClick={() => setStep(4)}>
                    {t("apply.next")} <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: 確認・送信 */}
          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  {t("apply.step4")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
                  {isAuthenticated && user && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("apply.applicantName")}</span>
                        <span className="font-medium">{user.name ?? t("apply.notSet")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("apply.email")}</span>
                        <span className="font-medium text-right max-w-[60%] truncate">{user.email ?? t("apply.notSet")}</span>
                      </div>
                      <div className="border-t border-border pt-2" />
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("apply.guestCount")}</span>
                    <span className="font-medium">
                      {t("apply.adults")} {watch("adultsCount")}
                      {watch("childrenCount") ? ` / ${t("apply.children")} ${watch("childrenCount")}` : ""}
                      {watch("infantsCount") ? ` / ${t("apply.infants")} ${watch("infantsCount")}` : ""}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("apply.preferredArea")}</span>
                    <span className="font-medium">{watch("preferredArea") || t("apply.notSpecified")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("apply.preferredDate")}</span>
                    <span className="font-medium">
                      {watch("preferredDateFrom")
                        ? `${watch("preferredDateFrom")}${watch("preferredDateTo") ? ` ~ ${watch("preferredDateTo")}` : ""}`
                        : t("apply.notSpecified")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("apply.originCountry")}</span>
                    <span className="font-medium">{watch("originCountry") || t("apply.notSpecified")}</span>
                  </div>
                  {watch("dietaryRestrictions") && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("apply.dietary")}</span>
                      <span className="font-medium text-right max-w-[60%]">{watch("dietaryRestrictions")}</span>
                    </div>
                  )}
                  {watch("specialRequests") && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("apply.specialRequests")}</span>
                      <span className="font-medium text-right max-w-[60%]">{watch("specialRequests")}</span>
                    </div>
                  )}
                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between font-bold">
                      <span>{t("apply.totalPrice")}</span>
                      <span className="text-primary text-lg">¥{totalJpy.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{t("apply.priceNote")}</p>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
                  <p className="font-semibold text-amber-800 mb-1">{t("apply.afterApply")}</p>
                  <ol className="text-amber-700 space-y-1 list-decimal list-inside">
                    <li>{t("apply.afterStep1")}</li>
                    <li>{t("apply.afterStep2")}</li>
                    <li>{t("apply.afterStep3")}</li>
                    <li>{t("apply.afterStep4")}</li>
                  </ol>
                </div>

                {!isAuthenticated && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm">
                    <p className="font-semibold text-orange-800 mb-1">{t("apply.noteTitle")}</p>
                    <p className="text-orange-700">
                      {t("apply.noteDesc")}
                      <a href={getLoginUrl()} className="underline ml-1">{t("apply.loginToApply")}</a>
                    </p>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(3)}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> {t("apply.back")}
                  </Button>
                  <Button type="submit" disabled={submitMutation.isPending}>
                    {submitMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t("apply.sending")}</>
                    ) : (
                      t("apply.submit")
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </form>
      </div>
      <Footer />
    </div>
  );
}
