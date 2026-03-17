import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import { Link } from "wouter";

export default function VerifyEmail() {
  const { t } = useTranslation();
  const [location] = useLocation();
  const utils = trpc.useUtils();

  // URLからtokenを取得
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") ?? "";

  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-token">(
    token ? "loading" : "no-token"
  );
  const [newEmail, setNewEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const verifyMutation = trpc.user.verifyEmailToken.useMutation({
    onSuccess: (data) => {
      setNewEmail(data.newEmail);
      setStatus("success");
      // auth.meキャッシュを無効化して最新情報を取得
      utils.auth.me.invalidate();
    },
    onError: (err) => {
      setErrorMessage(err.message);
      setStatus("error");
    },
  });

  useEffect(() => {
    if (token && status === "loading") {
      verifyMutation.mutate({ token });
    }
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />
      <div className="flex-1 flex items-center justify-center py-16">
        <div className="bg-background rounded-2xl shadow-md p-8 max-w-md w-full mx-4 text-center space-y-6">
          {status === "loading" && (
            <>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <div className="space-y-2">
                <h1 className="text-xl font-bold">{t("verifyEmail.verifying")}</h1>
                <p className="text-sm text-muted-foreground">{t("verifyEmail.pleaseWait")}</p>
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div className="space-y-2">
                <h1 className="text-xl font-bold text-green-700">{t("verifyEmail.successTitle")}</h1>
                <p className="text-sm text-muted-foreground">
                  {t("verifyEmail.successDesc", { email: newEmail })}
                </p>
              </div>
              <Link href="/profile">
                <Button className="w-full">
                  {t("verifyEmail.goToProfile")}
                </Button>
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <div className="space-y-2">
                <h1 className="text-xl font-bold text-red-700">{t("verifyEmail.errorTitle")}</h1>
                <p className="text-sm text-muted-foreground">
                  {errorMessage || t("verifyEmail.errorDesc")}
                </p>
              </div>
              <Link href="/profile">
                <Button variant="outline" className="w-full">
                  {t("verifyEmail.goToProfile")}
                </Button>
              </Link>
            </>
          )}

          {status === "no-token" && (
            <>
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h1 className="text-xl font-bold">{t("verifyEmail.noTokenTitle")}</h1>
                <p className="text-sm text-muted-foreground">{t("verifyEmail.noTokenDesc")}</p>
              </div>
              <Link href="/profile">
                <Button variant="outline" className="w-full">
                  {t("verifyEmail.goToProfile")}
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
