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
import { Briefcase, ChevronDown, ChevronRight, ClipboardList, Globe, Menu, UtensilsCrossed, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [partnerOpen, setPartnerOpen] = useState(false);

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
        <div className="flex items-center justify-between h-16 gap-2">

          {/* ─── ロゴ ─────────────────────────────────────────────────── */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary shrink-0">
            <UtensilsCrossed className="w-6 h-6" />
            <span className="hidden sm:inline">YumHomeStay</span>
            <span className="sm:hidden">YumHS</span>
          </Link>

          {/* ─── デスクトップナビ（lg以上：1024px〜） ─────────────────── */}
          <div className="hidden lg:flex items-center gap-4 flex-1 justify-center">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors whitespace-nowrap ${
                  location === link.href ? "text-primary" : "text-foreground/70 hover:text-primary"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {/* パートナードロップダウン */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 text-sm font-medium text-foreground/70 hover:text-primary transition-colors whitespace-nowrap">
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

          {/* ─── 右サイド（lg以上：フル表示） ────────────────────────── */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <Link href="/apply">
              <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90 whitespace-nowrap">
                <ClipboardList className="w-3.5 h-3.5" />
                {t("nav.apply")}
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 px-2">
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
                  <Button variant="outline" size="sm" className="gap-2 max-w-[140px]">
                    <span className="truncate">{user?.name ?? user?.email ?? "User"}</span>
                    <ChevronDown className="w-3 h-3 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem asChild><Link href="/bookings">{t("nav.myBookings")}</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/host/dashboard">{t("host.dashboard")}</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/cooking-school/dashboard">{t("nav.cookingSchoolDashboard")}</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/agent/dashboard">{t("nav.agentDashboard")}</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/my-inquiries">{t("nav.myInquiries")}</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/profile">{t("nav.profile")}</Link></DropdownMenuItem>
                  {user?.role === "admin" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild><Link href="/admin">{t("admin.dashboard")}</Link></DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="text-destructive">{t("nav.logout")}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" asChild>
                  <Link href="/login">{t("nav.login")}</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/login?tab=register">{t("nav.register") || "無料登録"}</Link>
                </Button>
              </div>
            )}
          </div>

          {/* ─── ハンバーガーボタン（lg未満：1023px以下） ────────────── */}
          <button
            className="lg:hidden p-2 text-foreground rounded-md hover:bg-muted transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "メニューを閉じる" : "メニューを開く"}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ─── モバイル・タブレットメニュー（lg未満：1023px以下） ──────── */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-background/98 backdrop-blur-md px-4 py-3 space-y-1 max-h-[85vh] overflow-y-auto">
          {/* メインナビ */}
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center justify-between text-sm font-medium py-3 px-2 rounded-lg transition-colors ${
                location === link.href
                  ? "text-primary bg-primary/5"
                  : "text-foreground/70 hover:text-primary hover:bg-muted"
              }`}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
              <ChevronRight className="w-3.5 h-3.5 opacity-40" />
            </Link>
          ))}

          {/* パートナーセクション（展開可能） */}
          <div className="border-t border-border pt-2 mt-1">
            <button
              className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground py-3 px-2 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setPartnerOpen(!partnerOpen)}
            >
              <span className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                {t("nav.partners", "パートナー")}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${partnerOpen ? "rotate-180" : ""}`} />
            </button>
            {partnerOpen && (
              <div className="pl-4 space-y-1 mt-1">
                {partnerLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex flex-col py-2.5 px-2 rounded-lg hover:bg-muted transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="text-sm font-medium text-foreground/80">{link.label}</span>
                    <span className="text-xs text-muted-foreground mt-0.5">{link.desc}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Apply CTA */}
          <div className="pt-2">
            <Link href="/apply" onClick={() => setMobileOpen(false)}>
              <Button size="sm" className="w-full gap-1.5">
                <ClipboardList className="w-3.5 h-3.5" />
                {t("hero.ctaApply")}
              </Button>
            </Link>
          </div>

          {/* ログイン / ユーザーメニュー */}
          <div className="pt-2 border-t border-border">
            {isAuthenticated ? (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground px-2 py-1 font-medium">
                  {user?.name ?? user?.email ?? "User"}
                </p>
                {[
                  { href: "/bookings", label: t("nav.myBookings") },
                  { href: "/my-inquiries", label: t("nav.myInquiries") },
                  { href: "/profile", label: t("nav.profile") },
                  { href: "/host/dashboard", label: t("host.dashboard") },
                  { href: "/cooking-school/dashboard", label: t("nav.cookingSchoolDashboard") },
                  { href: "/agent/dashboard", label: t("nav.agentDashboard") },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between text-sm py-2.5 px-2 rounded-lg text-foreground/70 hover:text-primary hover:bg-muted transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                    <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                  </Link>
                ))}
                {user?.role === "admin" && (
                  <Link
                    href="/admin"
                    className="flex items-center justify-between text-sm py-2.5 px-2 rounded-lg text-foreground/70 hover:text-primary hover:bg-muted transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t("admin.dashboard")}
                    <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                  </Link>
                )}
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="flex w-full items-center text-sm text-destructive py-2.5 px-2 rounded-lg hover:bg-destructive/5 transition-colors"
                >
                  {t("nav.logout")}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <Button size="sm" variant="outline" className="w-full">{t("nav.login")}</Button>
                </Link>
                <Link href="/login?tab=register" onClick={() => setMobileOpen(false)}>
                  <Button size="sm" className="w-full">{t("nav.register") || "無料登録"}</Button>
                </Link>
              </div>
            )}
          </div>

          {/* 言語切り替え */}
          <div className="flex flex-wrap gap-2 pt-2 pb-1 border-t border-border">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => { i18n.changeLanguage(lang.code); setMobileOpen(false); }}
                className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                  i18n.language.startsWith(lang.code)
                    ? "border-primary text-primary font-semibold bg-primary/5"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                {lang.flag} <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
