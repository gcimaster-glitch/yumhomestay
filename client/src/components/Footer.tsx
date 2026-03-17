import { UtensilsCrossed, Mail, Globe, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-foreground text-background/80 mt-16">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">

          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-background font-bold text-lg mb-3">
              <UtensilsCrossed className="w-5 h-5 text-amber-400" />
              <span>YumHomeStay</span>
            </div>
            <p className="text-sm text-background/60 leading-relaxed mb-4">
              {t("footer.tagline")}
            </p>
            <div className="space-y-1.5 text-xs text-background/50">
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 shrink-0" />
                <span>{t("footer.address")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3 h-3 shrink-0" />
                <a href="mailto:info@g-ex.co.jp" className="hover:text-background/80 transition-colors">
                  info@g-ex.co.jp
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-3 h-3 shrink-0" />
                <a
                  href="https://g-ex.co.jp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-background/80 transition-colors"
                >
                  g-ex.co.jp
                </a>
              </div>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-background font-semibold mb-3 text-sm uppercase tracking-wide">
              {t("footer.company")}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-background transition-colors">
                  {t("footer.about")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-background transition-colors">
                  {t("footer.contact")}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-background transition-colors">
                  {t("footer.faq")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-background font-semibold mb-3 text-sm uppercase tracking-wide">
              {t("footer.services")}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/experiences" className="hover:text-background transition-colors">
                  {t("footer.findExperiences")}
                </Link>
              </li>
              <li>
                <Link href="/cooking-schools" className="hover:text-background transition-colors">
                  {t("footer.findCooking")}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-background transition-colors">
                  {t("footer.pricing", "料金プラン")}
                </Link>
              </li>
              <li>
                <Link href="/for-hosts" className="hover:text-background transition-colors">
                  {t("footer.becomeHost")}
                </Link>
              </li>
              <li>
                <Link href="/for-cooking-schools" className="hover:text-background transition-colors">
                  {t("footer.forCookingSchools", "料理教室の方へ")}
                </Link>
              </li>
              <li>
                <Link href="/for-agents" className="hover:text-background transition-colors">
                  {t("footer.forAgents", "旅行代理店の方へ")}
                </Link>
              </li>
              <li>
                <Link href="/host/register" className="hover:text-background transition-colors">
                  {t("footer.hostRegister")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-background font-semibold mb-3 text-sm uppercase tracking-wide">
              {t("footer.legal")}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="hover:text-background transition-colors">
                  {t("footer.terms")}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-background transition-colors">
                  {t("footer.privacy")}
                </Link>
              </li>
              <li>
                <Link href="/legal" className="hover:text-background transition-colors">
                  {t("footer.legalNotice")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/10 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-background/40">
          <span>
            {t("footer.copyright")}
          </span>
          <span>Powered by YumHomeStay</span>
        </div>
      </div>
    </footer>
  );
}
