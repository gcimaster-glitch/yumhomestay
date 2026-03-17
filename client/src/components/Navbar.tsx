import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getLoginUrl } from "@/const";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import { Briefcase, ChevronDown, ClipboardList, Globe, Menu, UtensilsCrossed, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/experiences", label: t("nav.experiences") },
    { href: "/hosts", label: t("nav.hosts", "YumHosts") },
    { href: "/cooking-schools", label: t("nav.cookingSchools") },
    { href: "/pricing", label: t("nav.pricing", "料金") },
    { href: "/#how-it-works", label: t("nav.howItWorks") },
  ];

  const partnerLinks = [
    { href: "/for-hosts", label: t("nav.forHosts", "ホストファミリー向け"), desc: t("nav.forHostsDesc", "ご自宅でゲストをお迎え") },
    { href: "/for-cooking-schools", label: t("nav.forCookingSchools", "料理教室向け"), desc: t("nav.forCookingSchoolsDesc", "体験プログラムを提供") },
    { href: "/for-agents", label: t("nav.forAgents", "旅行代理店向け"), desc: t("nav.forAgentsDesc", "送客で収益を獲得") },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
            <UtensilsCrossed className="w-6 h-6" />
            <span>YumHomeStay</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {/* Partner dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 text-sm font-medium text-foreground/70 hover:text-primary transition-colors">
                  <Briefcase className="w-3.5 h-3.5" />
                  {t("nav.partners", "パートナー")}
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                {partnerLinks.map((link) => (
                  <DropdownMenuItem key={link.href} asChild>
                    <Link href={link.href} className="flex flex-col items-start gap-0.5 py-2">
                      <span className="font-medium text-sm">{link.label}</span>
                      <span className="text-xs text-muted-foreground">{link.desc}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Apply CTA */}
          <div className="hidden md:block">
            <Link href="/apply">
              <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90">
                <ClipboardList className="w-3.5 h-3.5" />
                {t("nav.apply")}
              </Button>
            </Link>
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  <Globe className="w-4 h-4" />
                  <span className="text-xs uppercase">{i18n.language.slice(0, 2)}</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => i18n.changeLanguage(lang.code)}
                    className={i18n.language.startsWith(lang.code) ? "font-semibold text-primary" : ""}
                  >
                    {lang.flag} {lang.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <span className="max-w-24 truncate">{user?.name ?? user?.email ?? "User"}</span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/bookings">{t("nav.myBookings")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/host/dashboard">{t("host.dashboard")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/cooking-school/dashboard">{t("nav.cookingSchoolDashboard")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/agent/dashboard">{t("nav.agentDashboard")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-inquiries">{t("nav.myInquiries")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">{t("nav.profile")}</Link>
                  </DropdownMenuItem>
                  {user?.role === "admin" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin">{t("admin.dashboard")}</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="text-destructive">
                    {t("nav.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" asChild>
                <a href={getLoginUrl()}>{t("nav.login")}</a>
              </Button>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md px-4 py-4 space-y-3 max-h-[80vh] overflow-y-auto">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-sm font-medium text-foreground/70 hover:text-primary py-2.5"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t border-border pt-2">
            <p className="text-xs text-muted-foreground font-medium mb-1">{t("nav.partners", "パートナー")}</p>
            {partnerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-sm font-medium text-foreground/70 hover:text-primary py-2.5"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <Link href="/apply" onClick={() => setMobileOpen(false)}>
            <Button size="sm" className="w-full gap-1.5 mt-1">
              <ClipboardList className="w-3.5 h-3.5" />
              {t("hero.ctaApply")}
            </Button>
          </Link>
          <div className="pt-2 border-t border-border">
            {isAuthenticated ? (
              <div className="space-y-2">
                <Link href="/bookings" className="block text-sm py-2.5" onClick={() => setMobileOpen(false)}>
                  {t("nav.myBookings")}
                </Link>
                <Link href="/my-inquiries" className="block text-sm py-2.5" onClick={() => setMobileOpen(false)}>
                  {t("nav.myInquiries")}
                </Link>
                <Link href="/profile" className="block text-sm py-2.5" onClick={() => setMobileOpen(false)}>
                  {t("nav.profile")}
                </Link>
                <Link href="/host/dashboard" className="block text-sm py-2.5" onClick={() => setMobileOpen(false)}>
                  {t("host.dashboard")}
                </Link>
                {user?.role === "admin" && (
                  <Link href="/admin" className="block text-sm py-2.5" onClick={() => setMobileOpen(false)}>
                    {t("admin.dashboard")}
                  </Link>
                )}
                <button onClick={() => logout()} className="block w-full text-left text-sm text-destructive py-2.5">
                  {t("nav.logout")}
                </button>
              </div>
            ) : (
              <a href={getLoginUrl()} className="block">
                <Button size="sm" className="w-full">{t("nav.login")}</Button>
              </a>
            )}
          </div>
          {/* Language switcher mobile */}
          <div className="flex gap-2 pt-2">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => { i18n.changeLanguage(lang.code); setMobileOpen(false); }}
                className={`text-xs px-2 py-1 rounded border ${i18n.language.startsWith(lang.code) ? "border-primary text-primary font-semibold" : "border-border text-muted-foreground"}`}
              >
                {lang.flag}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
