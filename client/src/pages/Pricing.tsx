import { useTranslation } from "react-i18next";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  Baby,
  User,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  Clock,
  MapPin,
  UtensilsCrossed,
  ShieldCheck,
} from "lucide-react";
import {
  YHS_BASE_PRICE_JPY,
  YHS_EXTRA_ADULT_JPY,
  YHS_EXTRA_CHILD_JPY,
  YHS_EXTRA_INFANT_JPY,
  calcTotalSalesJpy,
} from "../../../shared/pricing";

function formatJpy(amount: number) {
  return `¥${amount.toLocaleString("ja-JP")}`;
}

const EXAMPLES = [
  { adults: 2, children: 0, infants: 0 },
  { adults: 3, children: 0, infants: 0 },
  { adults: 2, children: 1, infants: 0 },
  { adults: 4, children: 2, infants: 1 },
];

export default function Pricing() {
  const { t } = useTranslation();
  useSeoMeta({
    titleJa: 'YumHomeStay｜料金プラン｜ホームステイ・料理教室の費用',
    titleEn: 'YumHomeStay | Pricing Plans | Homestay & Cooking Class Fees',
    titleZh: 'YumHomeStay | 收费方案 | 家庭体験・料理教室费用',
    titleKo: 'YumHomeStay | 요금 플랜 | 홈스테이・요리 교실 비용',
    descriptionJa: 'YumHomeStayのホームステイ体験・料理教室の料金プランを確認。透明な価格設定で安心。',
    descriptionEn: 'View YumHomeStay pricing plans for homestay experiences and cooking classes. Transparent, no hidden fees.',
    keywordsJa: 'ホームステイ 料金,料理教室 費用,YumHomeStay 価格,ワンデイステイ 料金',
    keywordsEn: 'homestay price Japan, cooking class fee, YumHomeStay pricing',
    ogUrl: 'https://yumhomestay.com/pricing',
  });

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Hero ─── */}
      <section className="bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-red-950/20 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Badge className="mb-4 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 border-amber-200 dark:border-amber-800">
            {t("pricing.badge")}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            {t("pricing.title")}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("pricing.subtitle")}
          </p>
        </div>
      </section>

      {/* ─── Main Pricing Table ─── */}
      <section className="py-16 max-w-5xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {t("pricing.tableTitle")}
          </h2>
          <p className="text-muted-foreground">
            {t("pricing.tableDesc")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {/* Base Package */}
          <Card className="border-2 border-amber-400 dark:border-amber-600 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-amber-400 dark:bg-amber-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
              {t("pricing.recommended")}
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
                  <Users className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {t("pricing.basePackageTitle")}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {t("pricing.basePackageFor")}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-4xl font-bold text-amber-600 dark:text-amber-400">
                  {formatJpy(YHS_BASE_PRICE_JPY)}
                </span>
                <span className="text-muted-foreground mb-1">
                  {t("pricing.perSession")}
                </span>
              </div>
              <ul className="space-y-2 text-sm">
                {[
                  t("pricing.include1"),
                  t("pricing.include2"),
                  t("pricing.include3"),
                  t("pricing.include4"),
                  t("pricing.include5"),
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Additional Guests */}
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                  <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {t("pricing.additionalTitle")}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {t("pricing.additionalFor")}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Extra Adult */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">
                        {t("pricing.extraAdultLabel")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("pricing.extraAdultNote")}
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-foreground">
                    {formatJpy(YHS_EXTRA_ADULT_JPY)}
                  </span>
                </div>

                {/* Extra Child */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">
                        {t("pricing.extraChildLabel")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("pricing.extraChildNote")}
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-foreground">
                    {formatJpy(YHS_EXTRA_CHILD_JPY)}
                  </span>
                </div>

                {/* Extra Infant */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Baby className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">
                        {t("pricing.extraInfantLabel")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("pricing.extraInfantNote")}
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-foreground">
                    {formatJpy(YHS_EXTRA_INFANT_JPY)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* What's Included */}
        <Card className="mb-10 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <ShieldCheck className="w-5 h-5" />
              {t("pricing.includedTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  icon: <Clock className="w-5 h-5" />,
                  label: t("pricing.feat1"),
                  desc: t("pricing.feat1Desc"),
                },
                {
                  icon: <MapPin className="w-5 h-5" />,
                  label: t("pricing.feat2"),
                  desc: t("pricing.feat2Desc"),
                },
                {
                  icon: <UtensilsCrossed className="w-5 h-5" />,
                  label: t("pricing.feat3"),
                  desc: t("pricing.feat3Desc"),
                },
                {
                  icon: <ShieldCheck className="w-5 h-5" />,
                  label: t("pricing.feat4"),
                  desc: t("pricing.feat4Desc"),
                },
              ].map((feat, i) => (
                <div key={i} className="flex flex-col items-center text-center gap-2 p-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-full text-green-600 dark:text-green-400">
                    {feat.icon}
                  </div>
                  <p className="font-semibold text-sm text-green-800 dark:text-green-200">
                    {feat.label}
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">{feat.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Price Examples */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4 text-center">
            {t("pricing.examplesTitle")}
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {EXAMPLES.map((ex, i) => {
              const total = calcTotalSalesJpy(ex.adults, ex.children, ex.infants);
              const parts: string[] = [
                `${t("pricing.adults")} ${ex.adults}${t("pricing.persons")}`,
              ];
              if (ex.children > 0) parts.push(`${t("pricing.children")} ${ex.children}${t("pricing.persons")}`);
              if (ex.infants > 0) parts.push(`${t("pricing.infants")} ${ex.infants}${t("pricing.persons")}`);
              const label = parts.join(" + ");
              return (
                <Card key={i} className="text-center">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-1">{label}</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {formatJpy(total)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("pricing.taxIncluded")}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <Separator className="my-10" />

        {/* FAQ */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-500" />
            {t("pricing.faqTitle")}
          </h2>
          <div className="space-y-4">
            {[
              { q: t("pricing.faq1q"), a: t("pricing.faq1a") },
              { q: t("pricing.faq2q"), a: t("pricing.faq2a") },
              { q: t("pricing.faq3q"), a: t("pricing.faq3a") },
              { q: t("pricing.faq4q"), a: t("pricing.faq4a") },
              { q: t("pricing.faq5q"), a: t("pricing.faq5a") },
            ].map((faq, i) => (
              <Card key={i} className="border border-border">
                <CardContent className="pt-4 pb-4">
                  <p className="font-semibold text-foreground mb-2">Q. {faq.q}</p>
                  <p className="text-sm text-muted-foreground">A. {faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-10 text-white">
          <h2 className="text-2xl font-bold mb-3">
            {t("pricing.ctaTitle")}
          </h2>
          <p className="mb-6 opacity-90">
            {t("pricing.ctaDesc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-white text-amber-600 hover:bg-amber-50 font-bold"
            >
              <Link href="/apply">
                {t("pricing.ctaApply")}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
            >
              <Link href="/contact">
                {t("pricing.ctaContact")}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
