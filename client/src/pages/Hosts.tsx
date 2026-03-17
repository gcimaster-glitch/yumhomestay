import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, MapPin, Globe, ChefHat, Star, ArrowRight, Filter, X } from "lucide-react";
import { useMemo, useState } from "react";

// ─── Language badge helper ────────────────────────────────────────────────────
const LANG_LABELS: Record<string, string> = {
  ja: "日本語",
  en: "English",
  zh: "中文",
  ko: "한국어",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
};

const JAPAN_PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
];

function parseLangs(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ─── Host Card ────────────────────────────────────────────────────────────────
function HostCard({ host, lang }: { host: Record<string, unknown>; lang: string }) {
  const { t } = useTranslation();
  const bio =
    lang === "ja"
      ? (host.bioJa as string | null) || (host.bioEn as string | null) || ""
      : (host.bioEn as string | null) || (host.bioJa as string | null) || "";
  const langs = parseLangs(host.languages as string | null);
  const familyCount = (host.familyMemberCount as number | null) ?? 2;

  return (
    <Card className="group overflow-hidden border border-border/60 hover:shadow-lg hover:border-orange-200 transition-all duration-300 bg-card">
      {/* Profile image */}
      <div className="relative h-52 bg-gradient-to-br from-orange-50 to-amber-50 overflow-hidden">
        {host.profileImageUrl ? (
          <img
            src={host.profileImageUrl as string}
            alt={t("hosts.hostPhoto")}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center">
              <Users className="w-12 h-12 text-orange-400" />
            </div>
          </div>
        )}
        {Boolean(host.hasSpecialCertification) && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-orange-500 text-white text-xs font-semibold shadow-md">
              <Star className="w-3 h-3 mr-1" />
              {t("hosts.certified")}
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-5">
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            <MapPin className="w-3 h-3 mr-1" />
            {t("badge.stationPickup")}
          </Badge>
          <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border-green-200">
            <ChefHat className="w-3 h-3 mr-1" />
            {t("badge.ingredientsIncluded")}
          </Badge>
          <Badge variant="secondary" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
            <Users className="w-3 h-3 mr-1" />
            {t("badge.minGuests")}
          </Badge>
        </div>

        {(host.prefecture as string | null) && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
            <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span>{String(host.prefecture as string)}</span>
          </div>
        )}
        {host.nearestStation != null && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
            <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span>{String(host.nearestStation as string)}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
          <Users className="w-3.5 h-3.5 text-orange-400 shrink-0" />
          <span>
            {t("hosts.familyOf")} {String(familyCount)} {t("hosts.people")}
          </span>
        </div>

        {bio && (
          <p className="text-sm text-foreground/80 line-clamp-3 mb-4 leading-relaxed">{bio}</p>
        )}

        {langs.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            {langs.map((l) => (
              <Badge key={l} variant="outline" className="text-xs px-2 py-0">
                {LANG_LABELS[l] ?? l}
              </Badge>
            ))}
          </div>
        )}

        <Link href={`/apply?hostId=${String(host.id)}`}>
          <Button
            size="sm"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold group/btn"
          >
            {t("hosts.applyWithHost")}
            <ArrowRight className="w-4 h-4 ml-1.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function HostCardSkeleton() {
  return (
    <Card className="overflow-hidden border border-border/60">
      <Skeleton className="h-52 w-full rounded-none" />
      <CardContent className="p-5 space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-8 w-full" />
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Hosts() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  useSeoMeta({
    titleJa: 'YumHomeStay｜ホストファミリー一覧｜日本のホームステイホスト',
    titleEn: 'YumHomeStay | Meet Our Japanese Host Families',
    titleZh: 'YumHomeStay | 日本接待家庭一览',
    titleKo: 'YumHomeStay | 일본 호스트 가족 목록',
    descriptionJa: '日本全国のホストファミリー一覧。英語・中国語・韓国語対応のホストも多数。地域・言語・料理スタイルで検索可能。',
    descriptionEn: 'Browse Japanese host families available for one-day homestay experiences. Filter by region, language, and cooking style.',
    keywordsJa: 'ホストファミリー,日本ホームステイ,ホスト一覧,YumHomeStay',
    keywordsEn: 'Japanese host family, homestay host Japan, YumHomeStay hosts',
    ogUrl: 'https://yumhomestay.com/hosts',
  });

  const [filterLang, setFilterLang] = useState<string>("all");
  const [filterPref, setFilterPref] = useState<string>("all");

  const { data: hosts, isLoading } = trpc.host.list.useQuery({ limit: 100, offset: 0 });

  const filtered = useMemo(() => {
    if (!hosts) return [];
    return hosts.filter((host) => {
      const hostRecord = host as unknown as Record<string, unknown>;
      if (filterLang !== "all") {
        const langs = parseLangs(hostRecord.languages as string | null);
        if (!langs.includes(filterLang)) return false;
      }
      if (filterPref !== "all") {
        if ((hostRecord.prefecture as string | null) !== filterPref) return false;
      }
      return true;
    });
  }, [hosts, filterLang, filterPref]);

  const hasFilters = filterLang !== "all" || filterPref !== "all";

  const clearFilters = () => {
    setFilterLang("all");
    setFilterPref("all");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-50 via-amber-50 to-background pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-orange-100 text-orange-700 border-orange-200 text-sm font-semibold px-4 py-1.5">
            {t("hosts.badge")}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
            {t("hosts.title")}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t("hosts.subtitle")}
          </p>
        </div>
      </section>

      {/* Filter bar */}
      <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="w-4 h-4" />
            {t("search.filter") || "絞り込み"}
          </div>

          {/* Language filter */}
          <Select value={filterLang} onValueChange={setFilterLang}>
            <SelectTrigger className="w-40 h-8 text-sm">
              <Globe className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder={t("hosts.filterLang") || "対応言語"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("hosts.allLanguages") || "すべての言語"}</SelectItem>
              {Object.entries(LANG_LABELS).map(([code, label]) => (
                <SelectItem key={code} value={code}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Prefecture filter */}
          <Select value={filterPref} onValueChange={setFilterPref}>
            <SelectTrigger className="w-44 h-8 text-sm">
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

          {hasFilters && (
            <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={clearFilters}>
              <X className="w-3.5 h-3.5 mr-1" />
              {t("search.clearFilters") || "クリア"}
            </Button>
          )}

          <span className="ml-auto text-sm text-muted-foreground">
            {isLoading ? "..." : `${filtered.length} ${t("hosts.hostUnit") || "件"}`}
          </span>
        </div>
      </div>

      {/* Host grid */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-12 w-full">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <HostCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-orange-300" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">{t("hosts.noHosts")}</h2>
            <p className="text-muted-foreground mb-6">{t("hosts.noHostsDesc")}</p>
            {hasFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                {t("search.clearFilters") || "フィルターをクリア"}
              </Button>
            ) : (
              <Link href="/apply">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  {t("hosts.applyAnyway")}
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              {t("hosts.hostCount", { count: filtered.length })}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((host) => (
                <HostCard key={host.id} host={host as unknown as Record<string, unknown>} lang={lang} />
              ))}
            </div>
          </>
        )}

        {/* CTA section */}
        <div className="mt-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">{t("hosts.ctaTitle")}</h2>
          <p className="text-orange-100 mb-6 max-w-xl mx-auto">{t("hosts.ctaDesc")}</p>
          <Link href="/apply">
            <Button
              size="lg"
              className="bg-white text-orange-600 hover:bg-orange-50 font-bold px-8"
            >
              {t("hosts.ctaButton")}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
