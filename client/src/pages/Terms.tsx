import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollText } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Terms() {
  const { t } = useTranslation();

  const SECTIONS = [
    { id: "1",  title: t("terms.s1Title"),  content: t("terms.s1Content") },
    { id: "2",  title: t("terms.s2Title"),  content: t("terms.s2Content") },
    { id: "3",  title: t("terms.s3Title"),  content: t("terms.s3Content") },
    { id: "4",  title: t("terms.s4Title"),  content: t("terms.s4Content") },
    { id: "5",  title: t("terms.s5Title"),  content: t("terms.s5Content") },
    { id: "6",  title: t("terms.s6Title"),  content: t("terms.s6Content") },
    { id: "7",  title: t("terms.s7Title"),  content: t("terms.s7Content") },
    { id: "8",  title: t("terms.s8Title"),  content: t("terms.s8Content") },
    { id: "9",  title: t("terms.s9Title"),  content: t("terms.s9Content") },
    { id: "10", title: t("terms.s10Title"), content: t("terms.s10Content") },
    { id: "11", title: t("terms.s11Title"), content: t("terms.s11Content") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="bg-muted/30 border-b border-border py-12">
        <div className="container max-w-3xl">
          <div className="flex items-center gap-3 mb-3">
            <ScrollText className="w-6 h-6 text-amber-600" />
            <Badge variant="secondary">{t("terms.legalBadge")}</Badge>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t("terms.pageTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("terms.lastUpdated")}</p>
        </div>
      </section>

      {/* Content */}
      <div className="container max-w-3xl py-12">
        <div className="prose prose-sm max-w-none">
          <p className="text-muted-foreground mb-8 leading-relaxed">
            {t("terms.intro")}{" "}
            <a href="/contact" className="text-amber-600 hover:underline">{t("terms.contactLink")}</a>
            {t("terms.introSuffix")}
          </p>

          {/* TOC */}
          <div className="bg-muted/40 rounded-xl p-6 mb-8">
            <h2 className="text-sm font-semibold text-foreground mb-3">{t("terms.toc")}</h2>
            <ol className="space-y-1">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a href={`#section-${s.id}`} className="text-sm text-amber-600 hover:underline">
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </div>

          {/* Sections */}
          <div className="space-y-8">
            {SECTIONS.map((s, i) => (
              <div key={s.id} id={`section-${s.id}`}>
                <h2 className="text-lg font-bold text-foreground mb-3">{s.title}</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{s.content}</p>
                {i < SECTIONS.length - 1 && <Separator className="mt-8" />}
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 bg-amber-50 rounded-xl border border-amber-100">
            <p className="text-sm text-amber-800">
              <strong>{t("terms.companyName")}</strong><br />
              {t("terms.companyAddress")}<br />
              {t("terms.emailLabel")}<a href="mailto:info@g-ex.co.jp" className="underline">info@g-ex.co.jp</a>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
