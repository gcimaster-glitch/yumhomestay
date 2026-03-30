import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { useParams, useLocation } from "wouter";
import {
  ArrowLeft,
  ChefHat,
  Clock,
  Globe,
  GraduationCap,
  MapPin,
  Star,
  Users,
  CheckCircle,
  Utensils,
  CalendarDays,
  ExternalLink,
  Leaf,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ReviewSection } from "@/components/ReviewSection";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";

const LANG_LABELS: Record<string, string> = {
  ja: "日本語",
  en: "English",
  zh: "中文",
  ko: "한국어",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
};

function DietaryBadge({ option }: { option: string }) {
  const labels: Record<string, { labelKey: string | null; color: string }> = {
    vegan: { labelKey: "experience.dietaryVegan", color: "bg-green-100 text-green-700 border-green-200" },
    vegetarian: { labelKey: "experience.dietaryVegetarian", color: "bg-lime-100 text-lime-700 border-lime-200" },
    vegetarian_option: { labelKey: "experience.dietaryVegetarianOption", color: "bg-lime-100 text-lime-700 border-lime-200" },
    vegan_option: { labelKey: "experience.dietaryVeganOption", color: "bg-green-100 text-green-700 border-green-200" },
    halal: { labelKey: "experience.dietaryHalal", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    gluten_free_option: { labelKey: "experience.dietaryGlutenFree", color: "bg-amber-100 text-amber-700 border-amber-200" },
  };
  const info = labels[option] ?? { labelKey: null, color: "bg-gray-100 text-gray-700 border-gray-200" };
  const { t } = useTranslation();
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border font-medium ${info.color}`}>
      <Leaf className="w-3 h-3" />
      {info.labelKey ? t(info.labelKey) : option}
    </span>
  );
}

export default function CookingSchoolDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { t, i18n } = useTranslation();
  const schoolId = parseInt(id ?? "0", 10);

  const { data: school, isLoading: schoolLoading } = trpc.cookingSchool.getById.useQuery(
    { id: schoolId },
    { enabled: !!schoolId }
  );

  const { data: experiences, isLoading: expLoading } = trpc.cookingSchool.getExperiences.useQuery(
    { cookingSchoolId: schoolId },
    { enabled: !!schoolId }
  );
  const { data: ratingSummary } = trpc.cookingSchool.getRatingSummary.useQuery(
    { id: schoolId },
    { enabled: !!schoolId }
  );

  // ─── SEO変数・エフェクト： Hooksルール上 early return より前に定義
  const isJa = i18n.language.startsWith("ja");
  const isZh = i18n.language.startsWith("zh");
  const name = isJa ? school?.nameJa : (school?.nameEn ?? school?.nameJa);
  const description = isJa && school?.descriptionJa ? school?.descriptionJa : school?.descriptionEn;
  const languages: string[] = school?.languages ? JSON.parse(school.languages) : [];
  const certifications: string[] = school?.certifications ? JSON.parse(school.certifications) : [];
  const galleryImages: string[] = school?.galleryImageUrls ? JSON.parse(school.galleryImageUrls) : [];

  useEffect(() => {
    if (!school) return;
    document.title = `${name ?? ""} | YumHomeStay`;
    const scriptId = "jsonld-cooking-school";
    let el = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement("script");
      el.id = scriptId;
      el.type = "application/ld+json";
      document.head.appendChild(el);
    }
    const jsonLd: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "Course",
      name: name ?? "",
      description: description || "",
      image: galleryImages[0] || school.profileImageUrl || "",
      url: `https://yumhomestay.com/cooking-schools/${school.id}`,
      provider: {
        "@type": "Organization",
        name: name ?? "",
        url: `https://yumhomestay.com/cooking-schools/${school.id}`
      },
      offers: {
        "@type": "Offer",
        priceCurrency: "JPY",
        availability: "https://schema.org/InStock",
        url: `https://yumhomestay.com/cooking-schools/${school.id}`
      },
      inLanguage: languages,
      locationCreated: {
        "@type": "Place",
        name: school.prefecture || school.city || "Japan",
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
  }, [school, name, description, galleryImages, ratingSummary]);

  if (schoolLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-16 max-w-5xl">
          <div className="animate-pulse space-y-6">
            <div className="h-64 bg-muted rounded-2xl" />
            <div className="h-8 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-muted rounded-xl" />)}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!school) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-32 text-center">
          <ChefHat className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">{t("cookingSchoolDetail.notFound")}</h2>
          <Button onClick={() => navigate("/cooking-schools")} variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("cookingSchoolDetail.backToList")}
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Image */}
      <div className="relative h-72 md:h-96 bg-gradient-to-br from-amber-100 to-orange-200 overflow-hidden">
        {galleryImages[0] ? (
          <img
            src={galleryImages[0]}
            alt={name ?? ""}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <GraduationCap className="w-24 h-24 text-amber-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Back button */}
          <button
          onClick={() => navigate("/cooking-schools")}
          className="absolute top-4 left-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm text-foreground px-3 py-2 rounded-full text-sm font-medium hover:bg-white transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("cookingSchoolDetail.backToList")}
        </button>

        {/* School name overlay */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex flex-wrap gap-2 mb-2">
            {school.hasHalalKitchen && (
              <Badge className="bg-green-600 text-white text-xs">{t("cookingSchoolDetail.halalBadge")}</Badge>
            )}
            {school.hasWheelchairAccess && (
              <Badge className="bg-blue-600 text-white text-xs">{t("cookingSchoolDetail.wheelchairBadge")}</Badge>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">{name}</h1>
          {school.nameEn && isJa && (
            <p className="text-white/80 text-lg mt-1">{school.nameEn}</p>
          )}
        </div>
      </div>

      <div className="container py-10 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">

            {/* Description */}
            {description && (
              <section>
                <h2 className="text-xl font-bold mb-3">{t("cookingSchoolDetail.about")}</h2>
                <p className="text-muted-foreground leading-relaxed">{description}</p>
              </section>
            )}

            <Separator />

            {/* Experience Menu */}
            <section data-section="experiences">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-amber-600" />
                  {t("cookingSchoolDetail.experienceMenu")}
                </h2>
                <Badge variant="secondary" className="text-xs">
                  {t("cookingSchoolDetail.courseCount", { count: experiences?.length ?? 0 })}
                </Badge>
              </div>

              {expLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : !experiences || experiences.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-2xl">
                  <Utensils className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">{t("cookingSchoolDetail.noExperiences")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {experiences.map((exp) => {
                    const expTitle = isJa && exp.titleJa ? exp.titleJa : exp.titleEn;
                    const expDesc = isJa && exp.descriptionJa ? exp.descriptionJa : exp.descriptionEn;
                    const dietaryOptions: string[] = exp.dietaryOptions ? JSON.parse(exp.dietaryOptions) : [];
                    const expImages: string[] = exp.imageUrls ? JSON.parse(exp.imageUrls) : [];

                    return (
                      <Card key={exp.id} className="overflow-hidden hover:shadow-md transition-shadow border border-border/60">
                        <div className="flex flex-col sm:flex-row">
                          {/* Image */}
                          <div className="sm:w-40 h-32 sm:h-auto bg-gradient-to-br from-amber-50 to-orange-100 flex-shrink-0 relative overflow-hidden">
                            {expImages[0] ? (
                              <img src={expImages[0]} alt={expTitle ?? ""} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ChefHat className="w-10 h-10 text-amber-300" />
                              </div>
                            )}
                          </div>

                          <CardContent className="flex-1 p-4">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                              <div className="flex-1">
                                <h3 className="font-bold text-base text-foreground mb-1">{expTitle}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{expDesc}</p>

                                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-2">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                                    <span>{t("experience.minutes", { count: exp.durationMinutes })}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Users className="w-3.5 h-3.5 text-amber-600" />
                                    <span>{exp.minGuests}〜{exp.maxGuests}{t("common.person")}</span>
                                  </div>
                                  {exp.cuisineType && (
                                    <div className="flex items-center gap-1">
                                      <Utensils className="w-3.5 h-3.5 text-amber-600" />
                                      <span>{exp.cuisineType}</span>
                                    </div>
                                  )}
                                </div>

                                {dietaryOptions.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {dietaryOptions.map((opt) => (
                                      <DietaryBadge key={opt} option={opt} />
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col items-end gap-2 shrink-0">
                                <div className="text-right">
                                  <p className="text-xl font-bold text-foreground">
                                    ¥{exp.priceJpy.toLocaleString()}
                                  </p>
                                  <p className="text-xs text-muted-foreground">/ 1{t("common.person")}</p>
                                </div>
                                <Button
                                  size="sm"
                                  className="bg-amber-500 hover:bg-amber-600 text-white whitespace-nowrap"
                                  onClick={() => navigate(`/experiences/${exp.id}`)}
                                >
                                  <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
                                  {t("experience.bookNow")}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Gallery */}
            {galleryImages.length > 1 && (
              <>
                <Separator />
                <section>
                  <h2 className="text-xl font-bold mb-4">{t("cookingSchoolDetail.gallery")}</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {galleryImages.slice(1).map((img, i) => (
                      <div key={i} className="aspect-square rounded-xl overflow-hidden bg-muted">
                        <img src={img} alt={`Gallery ${i + 2}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" loading="lazy" decoding="async" />
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
            {/* Reviews */}
            <Separator />
            <ReviewSection cookingSchoolId={school.id} lang={isJa ? "ja" : "en"} />
          </div>

          {/* Sidebar */}
          <div className="space-y-5">

            {/* Quick Info Card */}
            <Card className="border border-border/60">
              <CardContent className="p-5 space-y-4">
                <h3 className="font-bold text-base">{t("cookingSchoolDetail.basicInfo")}</h3>

                {(school.prefecture || school.city) && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">{[school.prefecture, school.city].filter(Boolean).join(" ")}</p>
                      {school.nearestStation && (
                        <p className="text-xs text-muted-foreground mt-0.5">🚉 {school.nearestStation}</p>
                      )}
                    </div>
                  </div>
                )}

                {school.maxCapacity && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>{t("cookingSchoolDetail.maxCapacity", { count: school.maxCapacity })}</span>
                  </div>
                )}

                {languages.length > 0 && (
                  <div className="flex items-start gap-2 text-sm">
                    <Globe className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium mb-1">{t("cookingSchoolDetail.languages")}</p>
                      <div className="flex flex-wrap gap-1">
                        {languages.map((l) => (
                          <Badge key={l} variant="secondary" className="text-xs">
                            {LANG_LABELS[l] ?? l.toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {certifications.length > 0 && (
                  <div className="flex items-start gap-2 text-sm">
                    <Star className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium mb-1">{t("cookingSchoolDetail.certifications")}</p>
                      <div className="flex flex-wrap gap-1">
                        {certifications.map((c) => (
                          <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {school.websiteUrl && (
                  <a
                    href={school.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {t("cookingSchoolDetail.officialWebsite")}
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Facilities */}
            <Card className="border border-border/60">
              <CardContent className="p-5">
                <h3 className="font-bold text-base mb-3">{t("cookingSchoolDetail.facilities")}</h3>
                <div className="space-y-2">
                  <div className={`flex items-center gap-2 text-sm ${school.hasKitchenEquipment ? "text-foreground" : "text-muted-foreground line-through"}`}>
                    <CheckCircle className={`w-4 h-4 ${school.hasKitchenEquipment ? "text-green-500" : "text-muted-foreground"}`} />
                    {t("cookingSchoolDetail.kitchenEquipment")}
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${school.hasHalalKitchen ? "text-foreground" : "text-muted-foreground"}`}>
                    <CheckCircle className={`w-4 h-4 ${school.hasHalalKitchen ? "text-green-500" : "text-muted-foreground"}`} />
                    {t("cookingSchoolDetail.halalKitchen")}
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${school.hasWheelchairAccess ? "text-foreground" : "text-muted-foreground"}`}>
                    <CheckCircle className={`w-4 h-4 ${school.hasWheelchairAccess ? "text-green-500" : "text-muted-foreground"}`} />
                    {t("cookingSchoolDetail.wheelchairAccess")}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-100">
              <GraduationCap className="w-8 h-8 text-amber-600 mb-2" />
              <h3 className="font-bold text-base mb-1">{t("cookingSchoolDetail.ctaTitle")}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t("cookingSchoolDetail.ctaDesc")}
              </p>
              <Button
                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                onClick={() => {
                  // Scroll to experiences section
                  document.querySelector('[data-section="experiences"]')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {t("cookingSchoolDetail.viewMenu")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile floating CTA ─────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t border-border p-3">
        <Button
          className="w-full bg-amber-500 hover:bg-amber-600 text-white"
          onClick={() => {
            const el = document.querySelector('[data-section="experiences"]');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        >
          <Utensils className="w-4 h-4 mr-2" />
          {t("cookingSchoolDetail.viewMenu")}
        </Button>
      </div>
      {/* モバイルCTA分の余白 */}
      <div className="lg:hidden h-16" />

      <Footer />
    </div>
  );
}
