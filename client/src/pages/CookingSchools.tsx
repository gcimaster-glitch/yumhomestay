import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState } from "react";
import {
  ChefHat, MapPin, Users, Search, ArrowRight
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useTranslation } from "react-i18next";
import { useSeoMeta } from "@/hooks/useSeoMeta";

export default function CookingSchools() {
  const { t } = useTranslation();
  useSeoMeta({
    titleJa: 'YumHomeStay｜料理教室一覧｜日本全国の料理教室を検索',
    titleEn: 'YumHomeStay | Cooking Schools in Japan | Find & Book',
    titleZh: 'YumHomeStay | 日本料理教室一览・预约',
    titleKo: 'YumHomeStay | 일본 요리 교실 목록 · 예약',
    descriptionJa: '日本全国の料理教室を検索・予約。和食・洋食・ベジタリアン・ハラール対応も。外国語対応教室多数。',
    descriptionEn: 'Find and book cooking schools across Japan. Japanese, Western, vegetarian, and halal options available.',
    keywordsJa: '料理教室 日本,和食 料理教室,ハラール 料理,YumHomeStay,料理体験',
    keywordsEn: 'cooking school Japan, Japanese cooking class, halal cooking, YumHomeStay',
    ogUrl: 'https://yumhomestay.com/cooking-schools',
  });
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [selectedPrefecture, setSelectedPrefecture] = useState("");
  const [filterHalal, setFilterHalal] = useState(false);
  const [filterWheelchair, setFilterWheelchair] = useState(false);

  const { data: schools, isLoading } = trpc.cookingSchool.list.useQuery({
    limit: 50,
    offset: 0,
    prefecture: selectedPrefecture || undefined,
    hasHalalKitchen: filterHalal || undefined,
    hasWheelchairAccess: filterWheelchair || undefined,
  });

  const PREFECTURES = [
    "東京都", "大阪府", "京都府", "神奈川県", "愛知県", "福岡県",
    "北海道", "宮城県", "広島県", "沖縄県",
  ];

  const filtered = (schools ?? []).filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.nameJa?.toLowerCase().includes(q) ||
      s.nameEn?.toLowerCase().includes(q) ||
      s.city?.toLowerCase().includes(q) ||
      s.prefecture?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16">
        <div className="container text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <ChefHat className="w-4 h-4" />
            {t("cookingSchools.badge")}
          </div>
          <h1 className="text-4xl font-bold mb-4">
            {t("cookingSchools.heroTitle")}
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            {t("cookingSchools.heroSubtitle")}
          </p>
          <div className="flex gap-3 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("cookingSchools.searchPlaceholder")}
                className="pl-10"
              />
            </div>
            <Button>{t("common.search")}</Button>
          </div>
        </div>
      </section>

      <div className="container py-10 max-w-6xl">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedPrefecture("")}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                !selectedPrefecture ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"
              }`}
            >
              {t("common.all")}
            </button>
            {PREFECTURES.map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPrefecture(selectedPrefecture === p ? "" : p)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  selectedPrefecture === p ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => setFilterHalal(!filterHalal)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                filterHalal ? "bg-green-600 text-white border-green-600" : "border-border hover:border-green-600"
              }`}
            >
              {t("cookingSchools.halal")}
            </button>
            <button
              onClick={() => setFilterWheelchair(!filterWheelchair)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                filterWheelchair ? "bg-blue-600 text-white border-blue-600" : "border-border hover:border-blue-600"
              }`}
            >
              {t("cookingSchools.wheelchair")}
            </button>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <ChefHat className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t("cookingSchools.notFound")}</h2>
            <p className="text-muted-foreground mb-6">
              {t("cookingSchools.notFoundDesc")}
            </p>
            <Button variant="outline" onClick={() => {
              setSearch("");
              setSelectedPrefecture("");
              setFilterHalal(false);
              setFilterWheelchair(false);
            }}>
              {t("common.resetFilters")}
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {t("cookingSchools.resultCount", { count: filtered.length })}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((school) => {
                const languages = school.languages ? JSON.parse(school.languages) as string[] : [];
                return (
                  <Card
                    key={school.id}
                    className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group"
                    onClick={() => navigate(`/cooking-schools/${school.id}`)}
                  >
                    {/* Image placeholder */}
                    <div className="h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center relative">
                      {school.profileImageUrl ? (
                        <img
                          src={school.profileImageUrl}
                          alt={school.nameJa ?? ""}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ChefHat className="w-16 h-16 text-primary/40" />
                      )}
                      <div className="absolute top-3 right-3 flex gap-1">
                        {school.hasHalalKitchen && (
                          <Badge className="bg-green-600 text-white text-xs">{t("cookingSchools.halal")}</Badge>
                        )}
                        {school.hasWheelchairAccess && (
                          <Badge className="bg-blue-600 text-white text-xs">{t("cookingSchools.wheelchair")}</Badge>
                        )}
                      </div>
                    </div>

                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                        {school.nameJa}
                      </h3>
                      {school.nameEn && (
                        <p className="text-sm text-muted-foreground mb-2">{school.nameEn}</p>
                      )}

                      {(school.prefecture || school.city) && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{[school.prefecture, school.city].filter(Boolean).join(" ")}</span>
                        </div>
                      )}

                      {school.nearestStation && (
                        <p className="text-xs text-muted-foreground mb-3">
                          🚉 {school.nearestStation}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex gap-1 flex-wrap">
                          {languages.slice(0, 3).map((l: string) => (
                            <Badge key={l} variant="secondary" className="text-xs">{l.toUpperCase()}</Badge>
                          ))}
                          {languages.length > 3 && (
                            <Badge variant="secondary" className="text-xs">+{languages.length - 3}</Badge>
                          )}
                        </div>
                        {school.maxCapacity && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="w-3 h-3" />
                            <span>{t("cookingSchools.maxCapacity", { count: school.maxCapacity })}</span>
                          </div>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      >
                        {t("common.viewDetails")}
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {/* CTA for cooking schools */}
        <div className="mt-16 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10 border p-8 text-center">
          <ChefHat className="w-12 h-12 mx-auto text-primary mb-4" />
          <h2 className="text-2xl font-bold mb-2">{t("cookingSchools.ctaTitle")}</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            {t("cookingSchools.ctaDesc")}
          </p>
          <Button size="lg" onClick={() => navigate("/cooking-school/register")}>
            {t("cookingSchools.ctaButton")}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
