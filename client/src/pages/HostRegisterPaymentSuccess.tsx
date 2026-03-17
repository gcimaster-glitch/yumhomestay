import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { CheckCircle, CalendarDays, Mail, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

export default function HostRegisterPaymentSuccess() {
  const [, navigate] = useLocation();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="max-w-lg w-full mx-auto px-4">
          {/* Success icon */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {t("hostRegisterPaymentSuccess.title")}
            </h1>
            <p className="text-muted-foreground">
              {t("hostRegisterPaymentSuccess.subtitle")}
            </p>
          </div>

          {/* Next steps */}
          <div className="bg-card border rounded-xl p-6 space-y-4 mb-6">
            <h2 className="font-bold text-lg">{t("hostRegisterPaymentSuccess.nextSteps")}</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{t("hostRegisterPaymentSuccess.step1Title")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("hostRegisterPaymentSuccess.step1Desc")}
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CalendarDays className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{t("hostRegisterPaymentSuccess.step2Title")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("hostRegisterPaymentSuccess.step2Desc")}
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-muted-foreground">3</span>
                </div>
                <div>
                  <p className="font-semibold text-sm">{t("hostRegisterPaymentSuccess.step3Title")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("hostRegisterPaymentSuccess.step3Desc")}
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-muted-foreground">4</span>
                </div>
                <div>
                  <p className="font-semibold text-sm">{t("hostRegisterPaymentSuccess.step4Title")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("hostRegisterPaymentSuccess.step4Desc")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 mb-6">
            <p className="font-semibold mb-1">{t("hostRegisterPaymentSuccess.refundTitle")}</p>
            <p>{t("hostRegisterPaymentSuccess.refundDesc")}</p>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => navigate("/host/dashboard")} className="flex-1">
              {t("hostRegisterPaymentSuccess.goToDashboard")}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            <Button variant="outline" onClick={() => navigate("/")} className="flex-1">
              {t("hostRegisterPaymentSuccess.goToHome")}
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
