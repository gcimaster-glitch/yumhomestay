/**
 * PaymentDepositSuccess.tsx
 * 2段階決済 STEP1（20%仮押さえ）完了ページ
 *
 * お客様が20%の仮押さえ決済を完了した後に表示されるページ。
 * ホストとの日程調整中であることを明確に伝え、不安を取り除く。
 */
import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { CheckCircle2, Clock, CreditCard, Home, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PaymentDepositSuccess() {
  const { t } = useTranslation();
  const [location] = useLocation();
  const params = new URLSearchParams(location.split("?")[1] ?? "");
  const bookingId = params.get("booking_id") ? parseInt(params.get("booking_id")!) : null;

  // 予約情報を取得
  const { data: paymentStatus } = trpc.stripe.getPaymentStatus.useQuery(
    { bookingId: bookingId! },
    { enabled: !!bookingId }
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-lg w-full space-y-6">

          {/* 成功アイコン */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              仮押さえが完了しました！
            </h1>
            <p className="text-muted-foreground">
              20%の仮押さえ金のお支払いを受け付けました。
            </p>
          </div>

          {/* 金額サマリー */}
          {paymentStatus && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">予約番号</span>
                  <span className="font-medium">#{paymentStatus.bookingId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">合計金額</span>
                  <span className="font-medium">¥{paymentStatus.amountJpy.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="font-medium text-green-700">① 今回お支払い済み（20%）</span>
                  <span className="font-bold text-green-700">¥{(paymentStatus.depositAmountJpy ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">② ホスト確定後（80%）</span>
                  <span className="text-muted-foreground">¥{(paymentStatus.finalPaymentAmountJpy ?? 0).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 次のステップ説明 */}
          <Card>
            <CardContent className="pt-4 space-y-4">
              <h2 className="font-semibold text-base">次のステップ</h2>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">ホストとの日程調整中</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    スタッフがホストに連絡し、ご希望の日程を調整します。通常1〜3営業日以内にご連絡します。
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">ホスト確定後に残り80%をご請求</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ホストとの日程が確定した後、残り80%のお支払いリンクをメールでお送りします。
                    不成立の場合は仮押さえ金を全額返金いたします。
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">予約確定・体験当日</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    80%のお支払い完了後、予約が正式に確定します。体験当日をお楽しみに！
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 返金ポリシー */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            <p className="font-medium mb-1">全額返金保証</p>
            <p>ホストとの日程調整が不成立の場合、仮押さえ金（20%）を全額返金いたします。安心してお申し込みください。</p>
          </div>

          {/* アクションボタン */}
          <div className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href="/my/bookings">
                予約状況を確認する
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                トップページへ戻る
              </Link>
            </Button>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}

