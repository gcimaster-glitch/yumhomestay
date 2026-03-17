import { Link } from "wouter";
import { XCircle, ArrowLeft, CreditCard, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function PaymentCancel() {
  const { t } = useTranslation();
  const params = new URLSearchParams(window.location.search);
  const bookingId = params.get("booking_id") ? parseInt(params.get("booking_id")!) : null;
  const [isRetrying, setIsRetrying] = useState(false);

  const createCheckoutSession = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
    onError: (err) => {
      setIsRetrying(false);
      alert(t("common.error") + ": " + err.message);
    },
  });

  const handleRetryPayment = () => {
    if (!bookingId) return;
    setIsRetrying(true);
    createCheckoutSession.mutate({
      bookingId,
      currency: "JPY",
      successPath: "/payment/success",
      cancelPath: "/payment/cancel",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Cancel Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-14 h-14 text-red-400" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-gray-900">
            {t("payment.cancelTitle")}
          </h1>
        </div>

        {/* Message */}
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="pt-6 pb-6 space-y-4">
            <p className="text-gray-700 leading-relaxed">
              {t("payment.cancelMessage")}
            </p>

            {bookingId && (
              <div className="mt-4 p-3 bg-white rounded-lg border border-red-200">
                <p className="text-sm text-gray-500">{t("payment.bookingId")}</p>
                <p className="text-xl font-bold text-red-600">#{bookingId}</p>
                <p className="text-xs text-gray-400 mt-1">{t("payment.status")}: {t("payment.pendingPayment")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-left space-y-2">
          <div className="flex items-center gap-2 text-blue-700">
            <HelpCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">{t("payment.faq")}</span>
          </div>
          <ul className="space-y-1 text-sm text-blue-600 pl-6">
            <li>· {t("payment.faq1")}</li>
            <li>· {t("payment.faq2")}</li>
            <li>· {t("payment.faq3")}</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {bookingId && (
            <Button
              onClick={handleRetryPayment}
              disabled={isRetrying}
              className="w-full sm:w-auto gap-2 bg-amber-500 hover:bg-amber-600 text-white"
            >
              <CreditCard className="w-4 h-4" />
              {isRetrying ? t("common.processing") : t("payment.retryPayment")}
            </Button>
          )}
          <Link href="/my/bookings">
            <Button variant="outline" className="w-full sm:w-auto gap-2">
              <ArrowLeft className="w-4 h-4" />
              {t("payment.backToBookings")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
