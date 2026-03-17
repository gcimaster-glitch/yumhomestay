import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Legal() {
  const { t } = useTranslation();

  const ROWS = [
    { label: t("legal.labelSeller"), value: t("legal.valueSeller") },
    { label: t("legal.labelRepresentative"), value: t("legal.valueRepresentative") },
    { label: t("legal.labelAddress"), value: t("legal.valueAddress") },
    { label: t("legal.labelPhone"), value: t("legal.valuePhone") },
    { label: t("legal.labelEmail"), value: "info@g-ex.co.jp" },
    { label: t("legal.labelWebsite"), value: "https://g-ex.co.jp / https://yumhomestay.com" },
    { label: t("legal.labelServiceName"), value: t("legal.valueServiceName") },
    { label: t("legal.labelServiceContent"), value: t("legal.valueServiceContent") },
    { label: t("legal.labelPrice"), value: t("legal.valuePrice") },
    { label: t("legal.labelPaymentMethod"), value: t("legal.valuePaymentMethod") },
    { label: t("legal.labelPaymentTiming"), value: t("legal.valuePaymentTiming") },
    { label: t("legal.labelServiceTiming"), value: t("legal.valueServiceTiming") },
    { label: t("legal.labelCancellation"), value: t("legal.valueCancellation") },
    { label: t("legal.labelReturn"), value: t("legal.valueReturn") },
    { label: t("legal.labelEnvironment"), value: t("legal.valueEnvironment") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="bg-muted/30 border-b border-border py-12">
        <div className="container max-w-3xl">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="w-6 h-6 text-amber-600" />
            <Badge variant="secondary">{t("legal.badge")}</Badge>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t("legal.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("legal.lastUpdatedLabel")}</p>
        </div>
      </section>

      {/* Content */}
      <div className="container max-w-3xl py-12">
        <p className="text-muted-foreground mb-8 leading-relaxed">
          {t("legal.intro")}
        </p>

        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <tbody>
              {ROWS.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-muted/30" : "bg-background"}>
                  <td className="py-4 px-6 font-medium text-foreground w-40 border-r border-border/40 align-top">
                    {row.label}
                  </td>
                  <td className="py-4 px-6 text-muted-foreground leading-relaxed">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 p-6 bg-amber-50 rounded-xl border border-amber-100 text-sm text-amber-800 leading-relaxed">
          <p>
            {t("legal.contactNote")}
            <a href="/contact" className="underline font-medium">{t("legal.contactLink")}</a>
            {t("legal.contactOr")}
            <a href="mailto:info@g-ex.co.jp" className="underline font-medium ml-1">info@g-ex.co.jp</a>
            {" "}
            {t("common.contactSuffix", "")}
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
