import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { useEffect, lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import TermsAgreementModal from "./components/TermsAgreementModal";
import { trpc } from "@/lib/trpc";

// ─── Eager-loaded pages (critical path: LCP / first-paint) ───────────────────
// Home・Experiences・CookingSchools は初回アクセスで最も多く使われるため即時ロード
import Home from "./pages/Home";
import Experiences from "./pages/Experiences";
import CookingSchools from "./pages/CookingSchools";
import Hosts from "./pages/Hosts";

// ─── Lazy-loaded pages (code splitting でメインバンドルから分離) ──────────────
// 大きいページ優先（AdminDashboard 1841行・ComponentShowcase 1437行・HostDashboard 1017行）
const AdminDashboard       = lazy(() => import("./pages/AdminDashboard"));
const ComponentShowcase    = lazy(() => import("./pages/ComponentShowcase"));
const HostDashboard        = lazy(() => import("./pages/HostDashboard"));
const ExperienceDetail     = lazy(() => import("./pages/ExperienceDetail"));
const CookingSchoolDetail  = lazy(() => import("./pages/CookingSchoolDetail"));
const HostRegister         = lazy(() => import("./pages/HostRegister"));
const GuestApply           = lazy(() => import("./pages/GuestApply"));
const HostCalendar         = lazy(() => import("./pages/HostCalendar"));
const MyInquiries          = lazy(() => import("./pages/MyInquiries"));
const MyBookings           = lazy(() => import("./pages/MyBookings"));
const HostBookings         = lazy(() => import("./pages/HostBookings"));
const CookingSchoolRegister = lazy(() => import("./pages/CookingSchoolRegister"));
const CookingSchoolDashboard = lazy(() => import("./pages/CookingSchoolDashboard"));
const KycSubmit            = lazy(() => import("./pages/KycSubmit"));
const BookingDetail        = lazy(() => import("./pages/BookingDetail"));
const Profile              = lazy(() => import("./pages/Profile"));
const ReviewPage           = lazy(() => import("./pages/ReviewPage"));
const AgentDashboard       = lazy(() => import("./pages/AgentDashboard"));
const PaymentSuccess       = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCancel        = lazy(() => import("./pages/PaymentCancel"));
const HostRegisterPaymentSuccess = lazy(() => import("./pages/HostRegisterPaymentSuccess"));
const TroubleReport        = lazy(() => import("./pages/TroubleReport"));
const VerifyEmail          = lazy(() => import("./pages/VerifyEmail"));
const ResetPassword        = lazy(() => import("./pages/ResetPassword"));
const DemoLogin            = lazy(() => import("./pages/DemoLogin"));
const Login                = lazy(() => import("./pages/Login"));
const DemoHost             = lazy(() => import("./pages/DemoHost"));
const DemoCookingSchool    = lazy(() => import("./pages/DemoCookingSchool"));
const DemoAgent            = lazy(() => import("./pages/DemoAgent"));

// BtoB Landing Pages
const ForHosts             = lazy(() => import("./pages/ForHosts"));
const ForCookingSchools    = lazy(() => import("./pages/ForCookingSchools"));
const ForAgents            = lazy(() => import("./pages/ForAgents"));
const BusinessHost         = lazy(() => import("./pages/BusinessHost"));
const BusinessCookingSchool = lazy(() => import("./pages/BusinessCookingSchool"));
const BusinessAgent        = lazy(() => import("./pages/BusinessAgent"));

// Static Pages
const Pricing              = lazy(() => import("./pages/Pricing"));
const About                = lazy(() => import("./pages/About"));
const Terms                = lazy(() => import("./pages/Terms"));
const Privacy              = lazy(() => import("./pages/Privacy"));
const Legal                = lazy(() => import("./pages/Legal"));
const Contact              = lazy(() => import("./pages/Contact"));
const Faq                  = lazy(() => import("./pages/Faq"));
const PartnerThanks        = lazy(() => import("./pages/PartnerThanks"));

// ─── Suspense fallback: 軽量スピナー（CLSを防ぐため最小限のDOM） ──────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location]);
  return null;
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Public (eager) */}
        <Route path="/" component={Home} />
        <Route path="/experiences" component={Experiences} />
        <Route path="/hosts" component={Hosts} />
        <Route path="/cooking-schools" component={CookingSchools} />

        {/* Public (lazy) */}
        <Route path="/experiences/:id" component={ExperienceDetail} />
        <Route path="/cooking-schools/:id" component={CookingSchoolDetail} />

        {/* Booking */}
        <Route path="/bookings" component={MyBookings} />
        <Route path="/my/bookings" component={MyBookings} />
        <Route path="/bookings/:id" component={BookingDetail} />

        {/* Host */}
        <Route path="/host/register" component={HostRegister} />
        <Route path="/host/dashboard" component={HostDashboard} />
        <Route path="/host/calendar" component={HostCalendar} />
        <Route path="/host/bookings" component={HostBookings} />

        {/* Cooking School */}
        <Route path="/cooking-school/register" component={CookingSchoolRegister} />
        <Route path="/cooking-school/dashboard" component={CookingSchoolDashboard} />

        {/* Admin */}
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/component-showcase" component={ComponentShowcase} />

        {/* Profile */}
        <Route path="/profile" component={Profile} />

        {/* Review */}
        <Route path="/review/:id" component={ReviewPage} />

        {/* Agent */}
        <Route path="/agent/dashboard" component={AgentDashboard} />

        {/* Payment */}
        <Route path="/payment/success" component={PaymentSuccess} />
        <Route path="/payment/cancel" component={PaymentCancel} />
        <Route path="/host/register/payment/success" component={HostRegisterPaymentSuccess} />

        {/* Guest Apply */}
        <Route path="/apply" component={GuestApply} />
        <Route path="/my-inquiries" component={MyInquiries} />

        {/* Trouble Report */}
        <Route path="/trouble/report" component={TroubleReport} />

        {/* Static Pages */}
        <Route path="/pricing" component={Pricing} />
        <Route path="/about" component={About} />
        <Route path="/terms" component={Terms} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/legal" component={Legal} />
        <Route path="/contact" component={Contact} />
        <Route path="/faq" component={Faq} />

        {/* Email Verification */}
        <Route path="/verify-email" component={VerifyEmail} />

        {/* Password Reset */}
        <Route path="/reset-password" component={ResetPassword} />

        {/* Login (OAuth未設定時のフォールバック) */}
        <Route path="/login" component={Login} />

        {/* Demo Login (共通・後方互換) */}
        <Route path="/demo" component={DemoLogin} />
        {/* Demo Login (パートナー別独立ページ) */}
        <Route path="/demo/host" component={DemoHost} />
        <Route path="/demo/cooking-school" component={DemoCookingSchool} />
        <Route path="/demo/agent" component={DemoAgent} />
        <Route path="/kyc" component={KycSubmit} />

        {/* Partner Thanks */}
        <Route path="/thanks/partner" component={PartnerThanks} />

        {/* BtoB Landing Pages */}
        <Route path="/for-hosts" component={ForHosts} />
        <Route path="/for-cooking-schools" component={ForCookingSchools} />
        <Route path="/for-agents" component={ForAgents} />
        <Route path="/business/host" component={BusinessHost} />
        <Route path="/business/cooking-school" component={BusinessCookingSchool} />
        <Route path="/business/agent" component={BusinessAgent} />

        {/* Fallback */}
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

// 利用規約同意モーダルの表示制御
function TermsGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading, refresh } = useAuth();
  const utils = trpc.useUtils();

  // 認証済みかつ termsAgreedAt が null の場合にモーダル表示
  const needsTermsAgreement = isAuthenticated && user && !user.termsAgreedAt;

  if (loading) return <>{children}</>;

  return (
    <>
      {children}
      {needsTermsAgreement && (
        <TermsAgreementModal
          onAgreed={() => {
            // 同意後はユーザー情報を再取得してモーダルを閉じる
            utils.auth.me.invalidate();
            refresh();
          }}
        />
      )}
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ScrollToTop />
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <TermsGuard>
            <Router />
          </TermsGuard>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
