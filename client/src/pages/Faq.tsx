import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, ChevronDown, ChevronUp, Users, ChefHat } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSeoMeta } from "@/hooks/useSeoMeta";

type FaqItem = { q: string; a: string };

function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div
          key={i}
          className="border border-border/60 rounded-xl overflow-hidden"
        >
          <button
            className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/30 transition-colors"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
          >
            <span className="font-medium text-foreground pr-4">{item.q}</span>
            {openIndex === i ? (
              <ChevronUp className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
          </button>
          {openIndex === i && (
            <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-4">
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Faq() {
  const { t } = useTranslation();
  useSeoMeta({
    titleJa: 'よくある質問（FAQ）｜YumHomeStay ホームステイ・料理教室',
    titleEn: 'FAQ | YumHomeStay Homestay & Cooking Class Questions',
    titleZh: '常见问题（FAQ）| YumHomeStay',
    titleKo: '자주 묻는 질문（FAQ）| YumHomeStay',
    descriptionJa: 'YumHomeStayのよくある質問。予約方法・キャンセルポリシー・ホスト申請など疑問を解決。',
    descriptionEn: 'Find answers to frequently asked questions about YumHomeStay bookings, cancellations, and host applications.',
    keywordsJa: 'YumHomeStay FAQ,ホームステイ よくある質問,料理教室 Q&A',
    keywordsEn: 'YumHomeStay FAQ, homestay questions, cooking class help',
    ogUrl: 'https://yumhomestay.com/faq',
  });
  const [tab, setTab] = useState<"guest" | "host">("guest");

  const GUEST_FAQS: FaqItem[] = [
    { q: t("faq.g1q"), a: t("faq.g1a") },
    { q: t("faq.g2q"), a: t("faq.g2a") },
    { q: t("faq.g3q"), a: t("faq.g3a") },
    { q: t("faq.g4q"), a: t("faq.g4a") },
    { q: t("faq.g5q"), a: t("faq.g5a") },
    { q: t("faq.g6q"), a: t("faq.g6a") },
    { q: t("faq.g7q"), a: t("faq.g7a") },
    { q: t("faq.g8q"), a: t("faq.g8a") },
  ];

  const HOST_FAQS: FaqItem[] = [
    { q: t("faq.h1q"), a: t("faq.h1a") },
    { q: t("faq.h2q"), a: t("faq.h2a") },
    { q: t("faq.h3q"), a: t("faq.h3a") },
    { q: t("faq.h4q"), a: t("faq.h4a") },
    { q: t("faq.h5q"), a: t("faq.h5a") },
    { q: t("faq.h6q"), a: t("faq.h6a") },
    { q: t("faq.h7q"), a: t("faq.h7a") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="bg-muted/30 border-b border-border py-12">
        <div className="container max-w-3xl">
          <div className="flex items-center gap-3 mb-3">
            <HelpCircle className="w-6 h-6 text-amber-600" />
            <Badge variant="secondary">{t("faq.badge")}</Badge>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t("faq.pageTitle")}</h1>
          <p className="text-muted-foreground">
            {t("faq.subtitle")}
            <a href="/contact" className="text-amber-600 hover:underline ml-1">{t("faq.contactLink")}</a>
            {t("faq.subtitleSuffix")}
          </p>
        </div>
      </section>

      <div className="container max-w-3xl py-12">
        {/* Tab */}
        <div className="flex gap-2 mb-8 p-1 bg-muted/40 rounded-xl w-fit">
          <button
            onClick={() => setTab("guest")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              tab === "guest"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-4 h-4" />
            {t("faq.forGuest")}
          </button>
          <button
            onClick={() => setTab("host")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              tab === "host"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ChefHat className="w-4 h-4" />
            {t("faq.forHost")}
          </button>
        </div>

        {tab === "guest" ? (
          <FaqAccordion items={GUEST_FAQS} />
        ) : (
          <FaqAccordion items={HOST_FAQS} />
        )}

        {/* CTA */}
        <div className="mt-12 p-6 bg-amber-50 rounded-xl border border-amber-100 text-center">
          <h3 className="font-bold text-amber-800 mb-2">{t("faq.ctaTitle")}</h3>
          <p className="text-sm text-amber-700 mb-4">{t("faq.ctaDesc")}</p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 bg-amber-600 text-white text-sm font-medium px-6 py-2.5 rounded-full hover:bg-amber-700 transition-colors"
          >
            {t("faq.ctaButton")}
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
}
