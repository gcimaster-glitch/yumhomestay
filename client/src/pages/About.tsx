import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Globe, Heart, MapPin, Mail, ExternalLink, Users, ChefHat, Star, Lightbulb } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSeoMeta } from "@/hooks/useSeoMeta";

const COMPANY = {
  website: "https://g-ex.co.jp",
  email: "info@g-ex.co.jp",
};

export default function About() {
  const { t } = useTranslation();
  useSeoMeta({
    titleJa: 'YumHomeStayについて｜日本のホームステイ体験プラットフォーム',
    titleEn: "About YumHomeStay | Japan's Homestay Experience Platform",
    titleZh: '关于YumHomeStay | 日本家庭体験平台',
    titleKo: 'YumHomeStay 소개 | 일본 홈스테이 체험 플랫폼',
    descriptionJa: 'YumHomeStayのミッションとビジョン。日本のホストファミリーと世界の旅行者をつなぐ体験プラットフォーム。',
    descriptionEn: "Learn about YumHomeStay's mission to connect travelers with Japanese host families for authentic cultural experiences.",
    keywordsJa: 'YumHomeStay 会社概要,ホームステイ プラットフォーム,日本文化体験',
    keywordsEn: 'about YumHomeStay, Japan homestay platform, cultural exchange',
    ogUrl: 'https://yumhomestay.com/about',
  });

  const VALUES = [
    {
      icon: Heart,
      title: t("about.value1Title"),
      desc: t("about.value1Desc"),
    },
    {
      icon: Globe,
      title: t("about.value2Title"),
      desc: t("about.value2Desc"),
    },
    {
      icon: Users,
      title: t("about.value3Title"),
      desc: t("about.value3Desc"),
    },
    {
      icon: Lightbulb,
      title: t("about.value4Title"),
      desc: t("about.value4Desc"),
    },
  ];

  const STATS = [
    { value: "1,200+", label: t("about.statGuests") },
    { value: "4.9", label: t("about.statRating") },
    { value: "47", label: t("about.statPrefectures") },
    { value: "2020", label: t("about.statFounded") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-background py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-amber-400 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-orange-400 blur-3xl" />
        </div>
        <div className="container max-w-4xl relative">
          <Badge variant="secondary" className="mb-4">{t("about.badge")}</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            {t("about.heroTitle1")}<br />
            <span className="text-amber-600">{t("about.heroTitle2")}</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
            {t("about.heroDesc")}
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-muted/30">
        <div className="container max-w-4xl py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-bold text-amber-600">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="container max-w-4xl py-16">
        <div className="flex items-center gap-3 mb-6">
          <ChefHat className="w-6 h-6 text-amber-600" />
          <h2 className="text-2xl font-bold text-foreground">{t("about.missionTitle")}</h2>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-8">
          <blockquote className="text-2xl font-bold text-amber-800 mb-4 leading-relaxed">
            「{t("about.missionQuote")}」
          </blockquote>
          <p className="text-muted-foreground leading-relaxed">
            {t("about.missionDesc")}
          </p>
        </div>
      </section>

      <Separator className="container max-w-4xl" />

      {/* Values */}
      <section className="container max-w-4xl py-16">
        <div className="flex items-center gap-3 mb-8">
          <Star className="w-6 h-6 text-amber-600" />
          <h2 className="text-2xl font-bold text-foreground">{t("about.valuesTitle")}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {VALUES.map((v) => (
            <div key={v.title} className="flex gap-4 p-6 rounded-xl border border-border/60 hover:border-amber-200 hover:bg-amber-50/30 transition-colors">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <v.icon className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Separator className="container max-w-4xl" />

      {/* Company Info */}
      <section className="container max-w-4xl py-16">
        <div className="flex items-center gap-3 mb-8">
          <MapPin className="w-6 h-6 text-amber-600" />
          <h2 className="text-2xl font-bold text-foreground">{t("about.companyInfoTitle")}</h2>
        </div>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <tbody>
              {[
                { label: t("about.companyName"), value: t("about.companyNameValue") },
                { label: t("about.companyNameEn"), value: "Gastronomy Experience Inc." },
                { label: t("about.companyAddress"), value: t("about.companyAddressValue") },
                { label: t("about.companyBusiness"), value: t("about.companyBusinessValue") },
                {
                  label: t("about.companyWebsite"),
                  value: (
                    <a
                      href={COMPANY.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-600 hover:underline flex items-center gap-1"
                    >
                      {COMPANY.website}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ),
                },
                {
                  label: t("about.companyEmail"),
                  value: (
                    <a href={`mailto:${COMPANY.email}`} className="text-amber-600 hover:underline flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {COMPANY.email}
                    </a>
                  ),
                },
              ].map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-muted/30" : "bg-background"}>
                  <td className="py-4 px-6 font-medium text-foreground w-40 border-r border-border/40">{row.label}</td>
                  <td className="py-4 px-6 text-muted-foreground">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-amber-600 to-orange-600 text-white py-16">
        <div className="container max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">{t("about.ctaTitle")}</h2>
          <p className="text-white/80 mb-8 text-lg">
            {t("about.ctaDesc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-white text-amber-700 font-semibold px-8 py-3 rounded-full hover:bg-amber-50 transition-colors"
            >
              <Mail className="w-4 h-4" />
              {t("about.ctaContact")}
            </a>
            <a
              href="/for-hosts"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white font-semibold px-8 py-3 rounded-full hover:bg-white/10 transition-colors"
            >
              <ChefHat className="w-4 h-4" />
              {t("about.ctaHost")}
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
