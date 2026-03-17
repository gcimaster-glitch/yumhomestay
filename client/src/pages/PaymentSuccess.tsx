import { useLocation, Link } from "wouter";
import { CheckCircle, Calendar, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useTranslation } from "react-i18next";
export default function PaymentSuccess() {
  const { t } = useTranslation();
  const [_location] = useLocation();;
  const params = new URLSearchParams(window.location.search);
  const bookingId = params.get("booking_id") ? parseInt(params.get("booking_id")!) : null;

  const { data: paymentStatus, isLoading } = trpc.stripe.getPaymentStatus.useQuery(
    { bookingId: bookingId! },
    { enabled: !!bookingId }
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-14 h-14 text-green-500" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-gray-900">
            {t("payment.successTitle")}
          </h1>
        </div>

        {/* Message */}
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6 pb-6 space-y-4">
            <p className="text-gray-700 leading-relaxed">
              {t("payment.successMessage")}
            </p>

            {bookingId && (
              <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
                <p className="text-sm text-gray-500">{t("payment.bookingId")}</p>
                <p className="text-xl font-bold text-green-700">#{bookingId}</p>
                {isLoading ? (
                  <p className="text-xs text-gray-400 mt-1">{t("payment.checkingStatus")}</p>
                ) : paymentStatus ? (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600">
                      {t("payment.status")}: <span className="font-medium text-green-600">
                        {paymentStatus.status === "confirmed" ? t("payment.confirmed") : t("payment.processing")}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">
                      {t("payment.amount")}: <span className="font-medium">
                        ¥{paymentStatus.amountJpy?.toLocaleString()}
                      </span>
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Steps */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-left space-y-3">
          <h3 className="font-semibold text-amber-800 text-sm uppercase tracking-wide">
            {t("payment.beforeVisit")}
          </h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-amber-700">
              <span className="mt-0.5 text-amber-500">①</span>
              <span>{t("payment.step1")}</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-amber-700">
              <span className="mt-0.5 text-amber-500">②</span>
              <span>{t("payment.step2")}</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-amber-700">
              <span className="mt-0.5 text-amber-500">③</span>
              <span>{t("payment.step3")}</span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/my/bookings">
            <Button className="w-full sm:w-auto gap-2 bg-green-600 hover:bg-green-700">
              <Calendar className="w-4 h-4" />
              {t("payment.viewBookings")}
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto gap-2">
              <Home className="w-4 h-4" />
              {t("common.backToHome")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
