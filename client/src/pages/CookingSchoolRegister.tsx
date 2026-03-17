import { useAuth } from "@/_core/hooks/useAuth";
import { PartnerFormWizard, type WizardStep } from "@/components/PartnerFormWizard";
import { PrefectureMapSelector } from "@/components/PrefectureMapSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { ChefHat, Building2, MapPin, Users, Globe, Award, ArrowLeft, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function CookingSchoolRegister() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);

  // sessionStorageから引き継ぎデータを読み込む
  const savedCookingLead = (() => {
    try {
      const raw = sessionStorage.getItem("yhs_cooking_school_lead");
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  })();

  const [form, setForm] = useState({
    nameJa: savedCookingLead?.nameJa ?? "",
    nameEn: savedCookingLead?.nameEn ?? "",
    descriptionJa: "",
    descriptionEn: "",
    websiteUrl: savedCookingLead?.websiteUrl ?? "",
    phoneNumber: savedCookingLead?.phone ?? "",
    contactEmail: savedCookingLead?.email ?? "",
    prefecture: savedCookingLead?.prefecture ?? "",
    city: savedCookingLead?.city ?? "",
    nearestStation: savedCookingLead?.nearestStation ?? "",
    googleMapsUrl: "",
    maxCapacity: 20,
    hasKitchenEquipment: true,
    hasWheelchairAccess: false,
    hasHalalKitchen: false,
    languages: ["ja"] as string[],
    businessLicenseNumber: "",
    certifications: [] as string[],
  });

  const WIZARD_STEPS: WizardStep[] = [
    { id: 1, title: t("cookingSchoolRegister.step1"), desc: t("cookingSchoolRegister.step1Desc") },
    { id: 2, title: t("cookingSchoolRegister.step2"), desc: t("cookingSchoolRegister.step2Desc") },
    { id: 3, title: t("cookingSchoolRegister.step3"), desc: t("cookingSchoolRegister.step3Desc") },
  ];

  const NAVIGATOR_MESSAGES = [
    { step: 1, message: "料理教室の登録を開始しましょう！まず教室の基本情報を入力してください。英語名も入力すると海外ゲストにも会いやすくなります✨" },
    { step: 2, message: "次は施設情報です。アクセス情報や設備について教えてください。ゲストが安心して参加できるか判断する重要な情報です😊" },
    { step: 3, message: "入力内容を確認してください。問題なければ「登録申請」ボタンを押してください。密昔のお連絡をお待ちしています！" },
  ];

  const registerMutation = trpc.cookingSchool.register.useMutation({
    onSuccess: () => {
      toast.success(t("cookingSchoolRegister.registerSuccess"));
      setStep(4);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <ChefHat className="w-16 h-16 mx-auto text-primary mb-4" />
          <h1 className="text-3xl font-bold mb-4">{t("cookingSchoolRegister.title")}</h1>
          <p className="text-muted-foreground mb-8">
            {t("cookingSchoolRegister.loginRequired")}
          </p>
          <Button asChild size="lg">
            <a href={getLoginUrl()}>{t("cookingSchoolRegister.loginToRegister")}</a>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  // PREFECTURES はPrefectureMapSelectorからexportされているため不要

  const LANGUAGES = [
    { code: "ja", label: "日本語" },
    { code: "en", label: "English" },
    { code: "zh", label: "中文" },
    { code: "ko", label: "한국어" },
    { code: "fr", label: "Français" },
    { code: "es", label: "Español" },
  ];

  const toggleLanguage = (code: string) => {
    setForm((prev) => ({
      ...prev,
      languages: prev.languages.includes(code)
        ? prev.languages.filter((l) => l !== code)
        : [...prev.languages, code],
    }));
  };

  const handleSubmit = () => {
    if (!form.nameJa) {
      toast.error(t("cookingSchoolRegister.nameJaRequired"));
      return;
    }
    registerMutation.mutate({
      ...form,
      websiteUrl: form.websiteUrl || undefined,
      googleMapsUrl: form.googleMapsUrl || undefined,
      contactEmail: form.contactEmail || undefined,
    });
  };

  if (step === 4) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center max-w-2xl">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-4">{t("cookingSchoolRegister.applicationComplete")}</h1>
          <p className="text-muted-foreground mb-2">
            {t("cookingSchoolRegister.reviewMessage")}
          </p>
          <p className="text-muted-foreground mb-8">
            {t("cookingSchoolRegister.afterApproval")}
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => navigate("/")}>
              {t("common.backToTop")}
            </Button>
            <Button onClick={() => navigate("/cooking-school/dashboard")}>
              {t("cookingSchoolRegister.toDashboard")}
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-12 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-2 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("common.backToTop")}
          </Button>
        </div>

        <Card className="overflow-hidden shadow-xl">
          <PartnerFormWizard
            currentStep={step}
            steps={WIZARD_STEPS}
            navigatorMessages={NAVIGATOR_MESSAGES}
            theme="orange"
            navigatorTitle="YumHomeStayナビゲーター"
          >
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nameJa">
                    {t("cookingSchoolRegister.nameJa")}<span className="text-destructive ml-1">*</span>
                  </Label>
                  <Input
                    id="nameJa"
                    value={form.nameJa}
                    onChange={(e) => setForm({ ...form, nameJa: e.target.value })}
                    placeholder={t("cookingSchoolRegister.nameJaPlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nameEn">{t("cookingSchoolRegister.nameEn")}</Label>
                  <Input
                    id="nameEn"
                    value={form.nameEn}
                    onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                    placeholder="e.g. Tanaka Cooking School"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descriptionJa">{t("cookingSchoolRegister.descriptionJa")}</Label>
                <Textarea
                  id="descriptionJa"
                  value={form.descriptionJa}
                  onChange={(e) => setForm({ ...form, descriptionJa: e.target.value })}
                  placeholder={t("cookingSchoolRegister.descriptionJaPlaceholder")}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descriptionEn">{t("cookingSchoolRegister.descriptionEn")}</Label>
                <Textarea
                  id="descriptionEn"
                  value={form.descriptionEn}
                  onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
                  placeholder="Describe your cooking school in English for international guests"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">{t("cookingSchoolRegister.contactEmail")}</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                    placeholder="contact@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">{t("cookingSchoolRegister.phoneNumber")}</Label>
                  <Input
                    id="phoneNumber"
                    value={form.phoneNumber}
                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                    placeholder="03-0000-0000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="websiteUrl">{t("cookingSchoolRegister.websiteUrl")}</Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  value={form.websiteUrl}
                  onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                  placeholder="https://www.example.com"
                />
              </div>

              <div className="space-y-3">
                <Label>{t("cookingSchoolRegister.languages")}</Label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(({ code, label }) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => toggleLanguage(code)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        form.languages.includes(code)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:border-primary"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    if (!form.nameJa) {
                      toast.error(t("cookingSchoolRegister.nameJaRequired"));
                      return;
                    }
                    setStep(2);
                  }}
                >
                  {t("cookingSchoolRegister.nextToStep2")}
                </Button>
              </div>
          </div>
        )}

        {/* Step 2: Facility Info */}
        {step === 2 && (
          <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <PrefectureMapSelector
                    value={form.prefecture}
                    onChange={(v) => setForm({ ...form, prefecture: v })}
                    label={t("cookingSchoolRegister.prefecture")}
                    required
                    defaultShowMap={true}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">{t("cookingSchoolRegister.city")}</Label>
                  <Input
                    id="city"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder={t("cookingSchoolRegister.cityPlaceholder")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nearestStation">{t("cookingSchoolRegister.nearestStation")}</Label>
                <Input
                  id="nearestStation"
                  value={form.nearestStation}
                  onChange={(e) => setForm({ ...form, nearestStation: e.target.value })}
                  placeholder={t("cookingSchoolRegister.nearestStationPlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="googleMapsUrl">{t("cookingSchoolRegister.googleMapsUrl")}</Label>
                <Input
                  id="googleMapsUrl"
                  type="url"
                  value={form.googleMapsUrl}
                  onChange={(e) => setForm({ ...form, googleMapsUrl: e.target.value })}
                  placeholder="https://maps.google.com/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxCapacity">{t("cookingSchoolRegister.maxCapacity")}</Label>
                <Input
                  id="maxCapacity"
                  type="number"
                  min={1}
                  max={500}
                  value={form.maxCapacity}
                  onChange={(e) => setForm({ ...form, maxCapacity: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-3">
                <Label>{t("cookingSchoolRegister.facilities")}</Label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="hasKitchenEquipment"
                      checked={form.hasKitchenEquipment}
                      onCheckedChange={(v) => setForm({ ...form, hasKitchenEquipment: !!v })}
                    />
                    <Label htmlFor="hasKitchenEquipment" className="cursor-pointer">
                      {t("cookingSchoolRegister.hasKitchenEquipment")}
                    </Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="hasWheelchairAccess"
                      checked={form.hasWheelchairAccess}
                      onCheckedChange={(v) => setForm({ ...form, hasWheelchairAccess: !!v })}
                    />
                    <Label htmlFor="hasWheelchairAccess" className="cursor-pointer">
                      {t("cookingSchoolRegister.hasWheelchairAccess")}
                    </Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="hasHalalKitchen"
                      checked={form.hasHalalKitchen}
                      onCheckedChange={(v) => setForm({ ...form, hasHalalKitchen: !!v })}
                    />
                    <Label htmlFor="hasHalalKitchen" className="cursor-pointer">
                      {t("cookingSchoolRegister.hasHalalKitchen")}
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessLicenseNumber">{t("cookingSchoolRegister.businessLicenseNumber")}</Label>
                <Input
                  id="businessLicenseNumber"
                  value={form.businessLicenseNumber}
                  onChange={(e) => setForm({ ...form, businessLicenseNumber: e.target.value })}
                  placeholder="e.g. T1234567890123"
                />
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t("common.back")}
                </Button>
                <Button onClick={() => setStep(3)}>
                  {t("cookingSchoolRegister.nextToStep3")}
                </Button>
              </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className="space-y-6">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">{t("cookingSchoolRegister.schoolName")}</span>
                  <span className="font-medium">{form.nameJa}</span>
                </div>
                {form.nameEn && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">{t("cookingSchoolRegister.nameEn")}</span>
                    <span className="font-medium">{form.nameEn}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">{t("cookingSchoolRegister.location")}</span>
                  <span className="font-medium">{[form.prefecture, form.city].filter(Boolean).join(" ") || t("common.notEntered")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">{t("cookingSchoolRegister.nearestStation")}</span>
                  <span className="font-medium">{form.nearestStation || t("common.notEntered")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">{t("cookingSchoolRegister.maxCapacity")}</span>
                  <span className="font-medium">{t("cookingSchoolRegister.capacityValue", { count: form.maxCapacity })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">{t("cookingSchoolRegister.languages")}</span>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {form.languages.map((l) => (
                      <Badge key={l} variant="secondary" className="text-xs">{l.toUpperCase()}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">{t("cookingSchoolRegister.facilities")}</span>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {form.hasKitchenEquipment && <Badge variant="secondary" className="text-xs">{t("cookingSchoolRegister.hasKitchenEquipment")}</Badge>}
                    {form.hasWheelchairAccess && <Badge variant="secondary" className="text-xs">{t("cookingSchoolRegister.hasWheelchairAccess")}</Badge>}
                    {form.hasHalalKitchen && <Badge variant="secondary" className="text-xs">{t("cookingSchoolRegister.hasHalalKitchen")}</Badge>}
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                <p className="text-sm text-amber-800">
                  <strong>{t("cookingSchoolRegister.reviewNote")}</strong>
                  {t("cookingSchoolRegister.reviewNoteDesc")}
                </p>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t("common.back")}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? t("common.processing") : t("cookingSchoolRegister.submitBtn")}
                </Button>
              </div>
          </div>
        )}
          </PartnerFormWizard>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
