import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { Car, ChefHat, Clock, Filter, Home, MapPin, Search, Star, Users, UtensilsCrossed, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";

const JAPAN_PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
];

const LANG_LABELS: Record<string, string> = {
  ja: "日本語",
  en: "English",
  zh: "中文",
  ko: "한국어",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
};

function parseLangs(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function Experiences() {
  const { t, i18n } = useTranslation();
  useSeoMeta({
    titleJa: 'YumHomeStay｜ホームステイ体験・料理教室一覧｜日本全国',
    titleEn: 'YumHomeStay | Browse Homestay & Cooking Experiences in Japan',
    titleZh: 'YumHomeStay | 浏览日本家庭体験・料理教室',
    titleKo: 'YumHomeStay | 일본 홈스테이 · 요리 체험 목록',
    descriptionJa: '日本全国のホームステイ体験・料理教室を検索。地域・ジャンル・言語対応で絞り込み。英語・中国語・韓国語対応。',
    descriptionEn: 'Search homestay and cooking class experiences across Japan. Filter by region, language, and style.',
    keywordsJa: 'ホームステイ 一覧,料理教室 日本,ワンデイステイ,日本文化体験,YumHomeStay',
    keywordsEn: 'homestay Japan list, cooking class Japan, one day experience, Japanese culture, YumHomeStay',
    ogUrl: 'https://yumhomestay.com/experiences',
  });

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"homestay" | "cooking">("homestay");

  // Homestay filters
  const [filterCuisine, setFilterCuisine] = useState<string>("all");
  const [filterLang, setFilterLang] = useState<string>("all");

  // Cooking school filters
  const [filterCSPref, setFilterCSPref] = useState<string>("all");
  const [filterCSCuisine, setFilterCSCuisine] = useState<string>("all");

  const { data: experiences, isLoading } = trpc.experience.list.useQuery({ limit: 100, offset: 0 });
  const { data: cookingSchools, isLoading: loadingCS } = trpc.cookingSchool.list.useQuery({ limit: 100, offset: 0 });

  // Derive unique cuisine types from data
  const cuisineTypes = useMemo(() => {
    if (!experiences) return [];
    const types = new Set(experiences.map((e) => e.cuisineType).filter(Boolean) as string[]);
    return Array.from(types).sort();
  }, [experiences]);

  const csCuisineTypes = useMemo(() => {
    if (!cookingSchools) return [];
    const types = new Set(cookingSchools.map((cs) => cs.cuisineSpecialty).filter(Boolean) as string[]);
    return Array.from(types).sort();
  }, [cookingSchools]);

  const filtered = useMemo(() => {
    if (!experiences) return [];
    return experiences.filter((exp) => {
      if (search) {
        const q = search.toLowerCase();
        const matchesSearch =
          exp.titleEn.toLowerCase().includes(q) ||
          (exp.titleJa?.toLowerCase().includes(q) ?? false) ||
          (exp.cuisineType?.toLowerCase().includes(q) ?? false);
        if (!matchesSearch) return false;
      }
      if (filterCuisine !== "all" && exp.cuisineType !== filterCuisine) return false;
      if (filterLang !== "all") {
        const langs = parseLangs((exp as unknown as Record<string, unknown>).hostLanguages as string | undefined);
        if (!langs.includes(filterLang)) return false;
      }
      return true;
    });
  }, [experiences, search, filterCuisine, filterLang]);

  const filteredCS = useMemo(() => {
    if (!cookingSchools) return [];
    return cookingSchools.filter((cs) => {
      if (search) {
        const q = search.toLowerCase();
        const matchesSearch =
          (cs.nameEn?.toLowerCase().includes(q) ?? false) ||
          (cs.nameJa?.toLowerCase().includes(q) ?? false) ||
          (cs.prefecture?.toLowerCase().includes(q) ?? false) ||
          (cs.cuisineSpecialty?.toLowerCase().includes(q) ?? false);
        if (!matchesSearch) return false;
      }
      if (filterCSPref !== "all" && cs.prefecture !== filterCSPref) return false;
      if (filterCSCuisine !== "all" && cs.cuisineSpecialty !== filterCSCuisine) return false;
      return true;
    });
  }, [cookingSchools, search, filterCSPref, filterCSCuisine]);

  const hasHomestayFilters = filterCuisine !== "all" || filterLang !== "all";
  const hasCookingFilters = filterCSPref !== "all" || filterCSCuisine !== "all";

  const clearHomestayFilters = () => { setFilterCuisine("all"); setFilterLang("all"); };
  const clearCookingFilters = () => { setFilterCSPref("all"); setFilterCSCuisine("all"); };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Header */}
      <section className="bg-gradient-to-br from-primary/5 to-accent/10 py-12">
        <div className="container">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{t("search.title")}</h1>
          <p className="text-muted-foreground mb-6">{t("search.subtitle")}</p>
          <div className="flex gap-3 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder={t("search.placeholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button>
              <Search className="w-4 h-4 mr-2" />
              {t("search.searchBtn")}
            </Button>
          </div>
        </div>
      </section>

      {/* Tabs + Results */}
      <section className="py-10 flex-1">
        <div className="container">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "homestay" | "cooking")}>
            <TabsList className="mb-6 h-12">
              <TabsTrigger value="homestay" className="flex items-center gap-2 px-6">
                <Home className="w-4 h-4" />
                {t("home.homestayTitle")}
                {filtered && (
                  <Badge variant="secondary" className="ml-1 text-xs">{filtered.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="cooking" className="flex items-center gap-2 px-6">
                <ChefHat className="w-4 h-4" />
                {t("home.cookingTitle")}
                {filteredCS && (
                  <Badge variant="secondary" className="ml-1 text-xs">{filteredCS.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ホームステイ体験タブ */}
            <TabsContent value="homestay">
              {/* Filter bar */}
              <div className="flex flex-wrap items-center gap-3 mb-6 p-3 bg-muted/40 rounded-lg border">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Filter className="w-4 h-4" />
                  {t("search.filter") || "絞り込み"}
                </div>
                <Select value={filterCuisine} onValueChange={setFilterCuisine}>
                  <SelectTrigger className="w-44 h-8 text-sm bg-background">
                    <UtensilsCrossed className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                    <SelectValue placeholder={t("search.filterCuisine") || "料理ジャンル"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("search.allCuisines") || "すべての料理"}</SelectItem>
                    {cuisineTypes.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterLang} onValueChange={setFilterLang}>
                  <SelectTrigger className="w-40 h-8 text-sm bg-background">
                    <SelectValue placeholder={t("hosts.filterLang") || "対応言語"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("hosts.allLanguages") || "すべての言語"}</SelectItem>
                    {Object.entries(LANG_LABELS).map(([code, label]) => (
                      <SelectItem key={code} value={code}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {hasHomestayFilters && (
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={clearHomestayFilters}>
                    <X className="w-3.5 h-3.5 mr-1" />
                    {t("search.clearFilters") || "クリア"}
                  </Button>
                )}
              </div>

              {isLoading ? (
                <div className="text-center py-16 text-muted-foreground">
                  <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  <p>{t("common.loading")}</p>
                </div>
              ) : filtered && filtered.length > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground mb-6">{t("search.resultsCount", { count: filtered.length, type: t("home.homestayTitle") })}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((exp) => {
                      const title = i18n.language.startsWith("ja") && exp.titleJa ? exp.titleJa : exp.titleEn;
                      const images = exp.imageUrls ? JSON.parse(exp.imageUrls) as string[] : [];
                      return (
                        <Card key={exp.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                          <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                            {images[0] ? (
                              <img src={images[0]} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" decoding="async" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/20">
                                <Home className="w-12 h-12 text-primary/40" />
                              </div>
                            )}
                            <Badge className="absolute top-2 right-2 bg-white/90 text-foreground text-xs font-semibold">
                              ¥{exp.priceJpy.toLocaleString()} / {t("common.person")}
                            </Badge>
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold text-foreground line-clamp-1 mb-1">{title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{exp.descriptionEn}</p>
                            <div className="flex flex-wrap gap-1 mb-3">
                              <Badge className="text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-50">
                                {t("badge.stationPickup")}
                              </Badge>
                              <Badge className="text-xs bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50">
                                {t("badge.ingredientsIncluded")}
                              </Badge>
                              <Badge className="text-xs bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50">
                                {t("badge.minGuests")}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mb-3">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{t("common.japan")}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 flex-shrink-0" />
                                <span>{t("experience.minutes", { count: exp.durationMinutes })}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3 flex-shrink-0" />
                                <span>{t("home.maxGuests", { count: exp.maxGuests })}</span>
                              </div>
                            </div>
                            {exp.cuisineType && (
                              <Badge variant="secondary" className="text-xs mb-3">
                                <UtensilsCrossed className="w-3 h-3 mr-1" />
                                {exp.cuisineType}
                              </Badge>
                            )}
                            <Link href={`/experiences/${exp.id}`}>
                              <Button size="sm" className="w-full">{t("experience.bookNow")}</Button>
                            </Link>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <Home className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">{t("search.noResults")}</p>
                  <p className="text-sm mt-1">{t("search.noResultsHostCta")}</p>
                  {hasHomestayFilters ? (
                    <Button className="mt-4" variant="outline" onClick={clearHomestayFilters}>
                      {t("search.clearFilters") || "フィルターをクリア"}
                    </Button>
                  ) : (
                    <Link href="/host/register">
                      <Button className="mt-4" variant="outline">{t("host.becomeHost")}</Button>
                    </Link>
                  )}
                </div>
              )}
            </TabsContent>

            {/* 料理教室体験タブ */}
            <TabsContent value="cooking">
              {/* Filter bar */}
              <div className="flex flex-wrap items-center gap-3 mb-6 p-3 bg-muted/40 rounded-lg border">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Filter className="w-4 h-4" />
                  {t("search.filter") || "絞り込み"}
                </div>
                <Select value={filterCSPref} onValueChange={setFilterCSPref}>
                  <SelectTrigger className="w-44 h-8 text-sm bg-background">
                    <MapPin className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                    <SelectValue placeholder={t("hosts.filterArea") || "エリア"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("hosts.allAreas") || "すべてのエリア"}</SelectItem>
                    {JAPAN_PREFECTURES.map((pref) => (
                      <SelectItem key={pref} value={pref}>{pref}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterCSCuisine} onValueChange={setFilterCSCuisine}>
                  <SelectTrigger className="w-44 h-8 text-sm bg-background">
                    <UtensilsCrossed className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                    <SelectValue placeholder={t("search.filterCuisine") || "料理ジャンル"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("search.allCuisines") || "すべての料理"}</SelectItem>
                    {csCuisineTypes.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {hasCookingFilters && (
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={clearCookingFilters}>
                    <X className="w-3.5 h-3.5 mr-1" />
                    {t("search.clearFilters") || "クリア"}
                  </Button>
                )}
              </div>

              {loadingCS ? (
                <div className="text-center py-16 text-muted-foreground">
                  <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  <p>{t("common.loading")}</p>
                </div>
              ) : filteredCS && filteredCS.length > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground mb-6">{t("search.resultsCount", { count: filteredCS.length, type: t("home.cookingTitle") })}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCS.map((cs) => {
                      const name = i18n.language.startsWith("ja") && cs.nameJa ? cs.nameJa : cs.nameEn;
                      const images = cs.imageUrls ? JSON.parse(cs.imageUrls) as string[] : [];
                      return (
                        <Card key={cs.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                          <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                            {images[0] ? (
                              <img src={images[0]} alt={name ?? ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" decoding="async" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
                                <ChefHat className="w-12 h-12 text-orange-300" />
                              </div>
                            )}
                            {cs.pricePerPersonJpy && (
                              <Badge className="absolute top-2 right-2 bg-white/90 text-foreground text-xs font-semibold">
                                ¥{cs.pricePerPersonJpy.toLocaleString()} / {t("common.person")}
                              </Badge>
                            )}
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold text-foreground line-clamp-1 mb-1">{name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{cs.descriptionEn}</p>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
                              {cs.prefecture && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 flex-shrink-0" />
                                  <span>{cs.prefecture}</span>
                                </div>
                              )}
                              {Boolean((cs as unknown as Record<string, unknown>).durationMinutes) && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 flex-shrink-0" />
                                  <span>{t("experience.minutes", { count: (cs as unknown as Record<string, unknown>).durationMinutes as number })}</span>
                                </div>
                              )}
                              {cs.maxStudents && (
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3 flex-shrink-0" />
                                  <span>{t("home.maxGuests", { count: cs.maxStudents })}</span>
                                </div>
                              )}
                              {cs.averageRating && (
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  <span>{Number(cs.averageRating).toFixed(1)}</span>
                                </div>
                              )}
                            </div>
                            {cs.cuisineSpecialty && (
                              <Badge variant="secondary" className="text-xs mb-3">
                                <UtensilsCrossed className="w-3 h-3 mr-1" />
                                {cs.cuisineSpecialty}
                              </Badge>
                            )}
                            <Link href={`/cooking-schools/${cs.id}`}>
                              <Button size="sm" className="w-full">{t("home.viewDetails")}</Button>
                            </Link>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <ChefHat className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">{t("search.noResultsCooking")}</p>
                  <p className="text-sm mt-1">{t("search.noResultsCookingCta")}</p>
                  {hasCookingFilters ? (
                    <Button className="mt-4" variant="outline" onClick={clearCookingFilters}>
                      {t("search.clearFilters") || "フィルターをクリア"}
                    </Button>
                  ) : (
                    <Link href="/cooking-school/register">
                      <Button className="mt-4" variant="outline">{t("nav.cookingSchoolRegister")}</Button>
                    </Link>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <Footer />
    </div>
  );
}
