import { TRPCError } from "@trpc/server";
import express from "express";
import Stripe from "stripe";
import { z } from "zod";
import { getDb, getHostByUserId, updateHost } from "../db";
import { bookings, experiences, hostRegistrationPayments, payments } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  YHS_BASE_PRICE_JPY,
  YHS_EXTRA_ADULT_JPY,
  YHS_EXTRA_CHILD_JPY,
  YHS_EXTRA_INFANT_JPY,
} from "../../shared/pricing";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-02-25.clover" })
  : null;

// Supported currencies with approximate JPY rates
const CURRENCY_MULTIPLIERS: Record<string, number> = {
  JPY: 1,
  USD: 0.0067,
  EUR: 0.0062,
  GBP: 0.0053,
  AUD: 0.010,
  CAD: 0.0091,
  SGD: 0.0090,
  HKD: 0.052,
  TWD: 0.22,
  KRW: 8.9,
  CNY: 0.049,
  THB: 0.24,
};

function convertFromJpy(amountJpy: number, currency: string): number {
  const rate = CURRENCY_MULTIPLIERS[currency.toUpperCase()] ?? CURRENCY_MULTIPLIERS.USD;
  const converted = amountJpy * rate;
  if (currency.toUpperCase() === "JPY") return Math.round(amountJpy);
  return Math.round(converted * 100);
}

export const stripeRouter = router({
  /** Create a Stripe Checkout Session for a booking */
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        bookingId: z.number(),
        currency: z.string().default("JPY"),
        successPath: z.string().default("/payment/success"),
        cancelPath: z.string().default("/payment/cancel"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!stripe) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe not configured" });

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Fetch booking
      const [booking] = await db.select().from(bookings).where(eq(bookings.id, input.bookingId)).limit(1);
      if (!booking) throw new TRPCError({ code: "NOT_FOUND", message: "予約が見つかりません" });
      if (booking.guestId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      // Check if already paid
      if (booking.status === "confirmed" || booking.status === "completed") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "この予約はすでに支払い済みです" });
      }
      if (booking.status === "cancelled_by_guest" || booking.status === "cancelled_by_host" || booking.status === "cancelled_by_admin") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "キャンセルされた予約には支払いできません" });
      }

      // Check if payment record already exists (succeeded)
      const [existingPayment] = await db.select().from(payments).where(eq(payments.bookingId, input.bookingId)).limit(1);
      if (existingPayment?.status === "succeeded") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "この予約はすでに支払い済みです" });
      }

      // Fetch experience
      const [experience] = await db.select().from(experiences).where(eq(experiences.id, booking.experienceId)).limit(1);
      if (!experience) throw new TRPCError({ code: "NOT_FOUND" });

      const currency = input.currency.toUpperCase();
      const amount = convertFromJpy(booking.amountJpy, currency);

      const origin = (ctx.req.headers.origin as string) ?? "https://yumhomestay.com";

      // Build line items with fee breakdown
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
        {
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: convertFromJpy(booking.basePriceJpy ?? YHS_BASE_PRICE_JPY, currency),
            product_data: {
              name: experience.titleEn ?? experience.titleJa ?? "YumHomeStay Experience",
              description: `基本料金（大人2名・4時間） / Base price (2 adults, 4 hours)`,
            },
          },
          quantity: 1,
        },
      ];

      // Extra adults
      if ((booking.extraAdultPriceJpy ?? 0) > 0) {
        const extraAdults = booking.adultsCount - 2;
        lineItems.push({
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: convertFromJpy(YHS_EXTRA_ADULT_JPY, currency),
            product_data: { name: `追加大人 / Extra Adult (×${extraAdults})` },
          },
          quantity: extraAdults,
        });
      }

      // Extra children
      if ((booking.extraChildPriceJpy ?? 0) > 0) {
        lineItems.push({
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: convertFromJpy(YHS_EXTRA_CHILD_JPY, currency),
            product_data: { name: `子供（5歳以上） / Child 5+ (×${booking.childrenCount})` },
          },
          quantity: booking.childrenCount,
        });
      }

      // Extra infants
      if ((booking.extraInfantPriceJpy ?? 0) > 0) {
        lineItems.push({
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: convertFromJpy(YHS_EXTRA_INFANT_JPY, currency),
            product_data: { name: `幼児（5歳未満） / Infant under 5 (×${booking.infantsCount ?? 0})` },
          },
          quantity: booking.infantsCount ?? 0,
        });
      }

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: ctx.user.email ?? undefined,
        line_items: lineItems,
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          booking_id: booking.id.toString(),
          user_id: ctx.user.id.toString(),
          customer_email: ctx.user.email ?? "",
          customer_name: ctx.user.name ?? "",
          currency_original: currency,
          amount_jpy: booking.amountJpy.toString(),
        },
        success_url: `${origin}${input.successPath}?payment=success&booking_id=${booking.id}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}${input.cancelPath}?payment=cancelled&booking_id=${booking.id}`,
        allow_promotion_codes: true,
        locale: "ja",
      });

      // Update booking status to pending_payment
      await db.update(bookings)
        .set({ status: "pending_payment", updatedAt: new Date() })
        .where(eq(bookings.id, input.bookingId));

      return { checkoutUrl: session.url, sessionId: session.id };
    }),

  /** Create a Stripe Checkout Session for host registration fee (¥5,000) */
  createHostRegistrationCheckout: protectedProcedure
    .input(
      z.object({
        successPath: z.string().default("/host/register/payment/success"),
        cancelPath: z.string().default("/host/register"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!stripe) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe not configured" });

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verify host exists
      const host = await getHostByUserId(ctx.user.id);
      if (!host) throw new TRPCError({ code: "NOT_FOUND", message: "ホスト登録が見つかりません。先にプロフィールを入力してください。" });

      // Check if already paid
      if (host.registrationFeePaid) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "登録料はすでにお支払い済みです" });
      }

      // Check for existing pending payment
      const [existingPayment] = await db.select()
        .from(hostRegistrationPayments)
        .where(eq(hostRegistrationPayments.hostId, host.id))
        .limit(1);

      if (existingPayment?.status === "succeeded") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "登録料はすでにお支払い済みです" });
      }

      const origin = (ctx.req.headers.origin as string) ?? "https://yumhomestay.com";

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: ctx.user.email ?? undefined,
        line_items: [
          {
            price_data: {
              currency: "jpy",
              unit_amount: 5000,
              product_data: {
                name: "YumHomeStay ホスト登録料",
                description: "ホスト審査・研修・認定書発行費用（¥5,000 税込）",
              },
            },
            quantity: 1,
          },
        ],
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          type: "host_registration",
          host_id: host.id.toString(),
          user_id: ctx.user.id.toString(),
          customer_email: ctx.user.email ?? "",
          customer_name: ctx.user.name ?? "",
        },
        success_url: `${origin}${input.successPath}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}${input.cancelPath}?payment=cancelled`,
        locale: "ja",
      });

      // Upsert payment record
      if (existingPayment) {
        await db.update(hostRegistrationPayments)
          .set({ stripeSessionId: session.id, status: "pending", updatedAt: new Date() })
          .where(eq(hostRegistrationPayments.hostId, host.id));
      } else {
        await db.insert(hostRegistrationPayments).values({
          hostId: host.id,
          stripeSessionId: session.id,
          amountJpy: 5000,
          status: "pending",
        });
      }

      return { checkoutUrl: session.url, sessionId: session.id };
    }),

  /** Get supported currencies */
  getSupportedCurrencies: publicProcedure.query(() => {
    return Object.keys(CURRENCY_MULTIPLIERS).map((code) => ({
      code,
      rate: CURRENCY_MULTIPLIERS[code],
    }));
  }),

  /** Convert JPY to foreign currency */
  convertCurrency: publicProcedure
    .input(z.object({ amountJpy: z.number(), currency: z.string() }))
    .query(({ input }) => {
      const currency = input.currency.toUpperCase();
      const rate = CURRENCY_MULTIPLIERS[currency] ?? CURRENCY_MULTIPLIERS.USD;
      return {
        currency,
        amountJpy: input.amountJpy,
        amountForeign: Math.round(input.amountJpy * rate * 100) / 100,
        rate,
      };
    }),

  /** Get payment status for a booking */
  getPaymentStatus: protectedProcedure
    .input(z.object({ bookingId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [booking] = await db.select().from(bookings).where(eq(bookings.id, input.bookingId)).limit(1);
      if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
      if (booking.guestId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const allPayments = await db.select().from(payments).where(eq(payments.bookingId, input.bookingId));
      const depositPayment = allPayments.find(p => p.paymentType === "deposit");
      const finalPayment = allPayments.find(p => p.paymentType === "final");
      const fullPayment = allPayments.find(p => p.paymentType === "full");

      return {
        bookingId: booking.id,
        status: booking.status,
        amountJpy: booking.amountJpy,
        currency: booking.currency,
        amountTotal: booking.amountTotal,
        // 2段階決済情報
        depositAmountJpy: booking.depositAmountJpy ?? 0,
        depositPaidAt: booking.depositPaidAt ?? null,
        finalPaymentAmountJpy: booking.finalPaymentAmountJpy ?? 0,
        finalPaymentPaidAt: booking.finalPaymentPaidAt ?? null,
        // 旧フロー互換
        paymentStatus: (fullPayment ?? depositPayment ?? finalPayment)?.status ?? null,
        paidAt: (fullPayment ?? depositPayment)?.createdAt ?? null,
      };
    }),

  /** 【新】 2段階決済 STEP1: 20%仮押さえのCheckout Sessionを作成 */
  createDepositCheckoutSession: protectedProcedure
    .input(
      z.object({
        bookingId: z.number(),
        currency: z.string().default("JPY"),
        successPath: z.string().default("/payment/deposit-success"),
        cancelPath: z.string().default("/payment/cancel"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!stripe) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe not configured" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [booking] = await db.select().from(bookings).where(eq(bookings.id, input.bookingId)).limit(1);
      if (!booking) throw new TRPCError({ code: "NOT_FOUND", message: "予約が見つかりません" });
      if (booking.guestId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      // キャンセル済みは不可
      if (["cancelled_by_guest", "cancelled_by_host", "cancelled_by_admin"].includes(booking.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "キャンセルされた予約には支払いできません" });
      }
      // すでに仮押さえ済みの場合は不可
      if (["deposit_paid", "awaiting_final_payment", "confirmed", "completed"].includes(booking.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "この予約はすでに仮押さえ済みです" });
      }

      const [experience] = await db.select().from(experiences).where(eq(experiences.id, booking.experienceId)).limit(1);
      if (!experience) throw new TRPCError({ code: "NOT_FOUND" });

      const currency = input.currency.toUpperCase();
      // 20%の仮押さえ金額を計算（小数点以下切り捨て）
      const depositAmountJpy = Math.floor(booking.amountJpy * 0.2);
      const finalPaymentAmountJpy = booking.amountJpy - depositAmountJpy; // 残ら80%
      const depositAmount = convertFromJpy(depositAmountJpy, currency);

      const origin = (ctx.req.headers.origin as string) ?? "https://yumhomestay.com";

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: ctx.user.email ?? undefined,
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              unit_amount: depositAmount,
              product_data: {
                name: `仮押さえ金（20%）/ Deposit (20%) - ${experience.titleEn ?? experience.titleJa}`,
                description: `合計金額¥${booking.amountJpy.toLocaleString()}の20%。ホストとの日程調整後、残ら80%を請求します。不成立の場合は全額返金。 / 20% of total ¥${booking.amountJpy.toLocaleString()}. Remaining 80% charged after host confirmation. Full refund if not confirmed.`,
              },
            },
            quantity: 1,
          },
        ],
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          booking_id: booking.id.toString(),
          user_id: ctx.user.id.toString(),
          customer_email: ctx.user.email ?? "",
          customer_name: ctx.user.name ?? "",
          currency_original: currency,
          amount_jpy: depositAmountJpy.toString(),
          payment_type: "deposit",
          total_amount_jpy: booking.amountJpy.toString(),
          final_payment_amount_jpy: finalPaymentAmountJpy.toString(),
        },
        success_url: `${origin}${input.successPath}?payment=deposit_success&booking_id=${booking.id}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}${input.cancelPath}?payment=cancelled&booking_id=${booking.id}`,
        locale: "ja",
      });

      // 予約のステータスを pending_deposit に更新
      await db.update(bookings)
        .set({
          status: "pending_deposit",
          depositAmountJpy,
          finalPaymentAmountJpy,
          depositStripeSessionId: session.id,
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, input.bookingId));

      return { checkoutUrl: session.url, sessionId: session.id, depositAmountJpy, finalPaymentAmountJpy };
    }),

  /** 【新】 2段階決済 STEP2: 残ら80%のCheckout Sessionを作成（スタッフまたはゲストが実行） */
  createFinalPaymentCheckoutSession: protectedProcedure
    .input(
      z.object({
        bookingId: z.number(),
        currency: z.string().default("JPY"),
        successPath: z.string().default("/payment/success"),
        cancelPath: z.string().default("/payment/cancel"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!stripe) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe not configured" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [booking] = await db.select().from(bookings).where(eq(bookings.id, input.bookingId)).limit(1);
      if (!booking) throw new TRPCError({ code: "NOT_FOUND", message: "予約が見つかりません" });

      // ゲストまたは管理者のみ実行可
      if (booking.guestId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      // awaiting_final_payment 状態のみ実行可
      if (booking.status !== "awaiting_final_payment") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "残ら80%の支払いは、ホストが合意した後にのみ可能です" });
      }

      const [experience] = await db.select().from(experiences).where(eq(experiences.id, booking.experienceId)).limit(1);
      if (!experience) throw new TRPCError({ code: "NOT_FOUND" });

      const currency = input.currency.toUpperCase();
      const finalAmountJpy = booking.finalPaymentAmountJpy ?? (booking.amountJpy - (booking.depositAmountJpy ?? 0));
      const finalAmount = convertFromJpy(finalAmountJpy, currency);

      const origin = (ctx.req.headers.origin as string) ?? "https://yumhomestay.com";

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: ctx.user.email ?? undefined,
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              unit_amount: finalAmount,
              product_data: {
                name: `残ら80%のお支払い / Final Payment (80%) - ${experience.titleEn ?? experience.titleJa}`,
                description: `ホストの合意が確認されました。残ら80%（¥${finalAmountJpy.toLocaleString()}）をお支払いください。 / Host confirmed. Please pay the remaining 80% (¥${finalAmountJpy.toLocaleString()}).`,
              },
            },
            quantity: 1,
          },
        ],
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          booking_id: booking.id.toString(),
          user_id: ctx.user.id.toString(),
          customer_email: ctx.user.email ?? "",
          customer_name: ctx.user.name ?? "",
          currency_original: currency,
          amount_jpy: finalAmountJpy.toString(),
          payment_type: "final",
          total_amount_jpy: booking.amountJpy.toString(),
        },
        success_url: `${origin}${input.successPath}?payment=success&booking_id=${booking.id}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}${input.cancelPath}?payment=cancelled&booking_id=${booking.id}`,
        locale: "ja",
      });

      // 予約の決済セッションIDを更新
      await db.update(bookings)
        .set({
          finalPaymentStripeSessionId: session.id,
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, input.bookingId));

      return { checkoutUrl: session.url, sessionId: session.id, finalAmountJpy };
    }),

  /** 【新】 スタッフ操作: 予約のホスト合意を記録し、awaiting_final_paymentに進める */
  approveDepositForFinalPayment: protectedProcedure
    .input(z.object({ bookingId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "管理者のみ実行可能です" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [booking] = await db.select().from(bookings).where(eq(bookings.id, input.bookingId)).limit(1);
      if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
      if (booking.status !== "deposit_paid") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "deposit_paid状態の予約のみ実行可能です" });
      }

      await db.update(bookings)
        .set({ status: "awaiting_final_payment", updatedAt: new Date() })
        .where(eq(bookings.id, input.bookingId));

      // ゲストに残ら80%支払いの通知を送信
      try {
        const { createNotification } = await import("../db");
        const { users: usersTable } = await import("../../drizzle/schema");
        const [guest] = await db.select().from(usersTable).where(eq(usersTable.id, booking.guestId)).limit(1);
        await createNotification({
          userId: booking.guestId,
          type: "booking_confirmed",
          titleJa: "ホストが確定しました！残ら80%のお支払いをお願いします",
          titleEn: "Host Confirmed! Please complete the remaining 80% payment",
          bodyJa: `予約 #${booking.id} のホストが確定しました。残ら80%（¥${(booking.finalPaymentAmountJpy ?? 0).toLocaleString()}）のお支払いをお願いします。`,
          bodyEn: `Your booking #${booking.id} host is confirmed. Please pay the remaining 80% (¥${(booking.finalPaymentAmountJpy ?? 0).toLocaleString()}).`,
          relatedBookingId: booking.id,
        });
        // メール送信
        if (guest?.email) {
          const { sendGuestPaymentLinkEmail } = await import("../email");
          const finalPaymentUrl = `https://www.yumhomestay.com/my/bookings`;
          await sendGuestPaymentLinkEmail({
            to: guest.email,
            guestName: guest.name ?? "ゲスト",
            paymentLinkUrl: finalPaymentUrl,
            adultsCount: booking.adultsCount,
            childrenCount: booking.childrenCount,
            lang: guest.preferredLanguage ?? "ja",
          });
        }
      } catch (err) {
        console.error("[approveDepositForFinalPayment] Notification/email failed:", err);
      }

      return { success: true };
    }),

  /** 【新】 全額返金（ホスト不合意の場合） */
  fullRefundDeposit: protectedProcedure
    .input(z.object({ bookingId: z.number(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      if (!stripe) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe not configured" });
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "管理者のみ実行可能です" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [booking] = await db.select().from(bookings).where(eq(bookings.id, input.bookingId)).limit(1);
      if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
      if (booking.status !== "deposit_paid") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "deposit_paid状態の予約のみ返金可能です" });
      }

      // 仮押さえの決済レコードを取得
      const allPayments = await db.select().from(payments).where(eq(payments.bookingId, input.bookingId));
      const depositPayment = allPayments.find(p => p.paymentType === "deposit" && p.status === "succeeded");
      if (!depositPayment?.stripePaymentIntentId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "返金対象の決済情報が見つかりません" });
      }

      // Stripe返金実行
      const refund = await stripe.refunds.create({
        payment_intent: depositPayment.stripePaymentIntentId,
        reason: "requested_by_customer",
        metadata: {
          booking_id: String(booking.id),
          refund_reason: input.reason ?? "ホスト不合意による全額返金",
        },
      });

      // 決済レコードを更新
      await db.update(payments)
        .set({ status: "refunded", refundedAt: new Date(), refundReason: input.reason ?? "ホスト不合意による全額返金" })
        .where(eq(payments.id, depositPayment.id));

      // 予約をキャンセルに
      await db.update(bookings)
        .set({
          status: "cancelled_by_admin",
          cancelledAt: new Date(),
          cancellationReason: input.reason ?? "ホスト不合意による全額返金",
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, input.bookingId));

      console.log(`[fullRefundDeposit] Refund created: refund_id=${refund.id}, booking_id=${booking.id}`);
      return { success: true, refundId: refund.id };
    }),
});

/** Register the Stripe webhook endpoint on the Express app */
export function registerStripeWebhook(app: import("express").Express) {
  // Stripe webhook route with inline raw body parser to ensure raw body is preserved
  app.post("/api/stripe/webhook", express.raw({ type: "*/*" }), async (req, res) => {
    if (!stripe) {
      res.status(500).json({ error: "Stripe not configured" });
      return;
    }
    const sig = req.headers["stripe-signature"] as string;
    // Try all possible webhook secret candidates in priority order
    const secretCandidates = [
      process.env.STRIPE_WEBHOOK_SECRET_PROD, // 本番URL用シークレット（yumhomestay.com、Identity対応）
      process.env.STRIPE_WEBHOOK_SECRET,      // 組み込みシークレット（Settings→Paymentで更新）
      process.env.STRIPE_WEBHOOK_SEACRET,     // 旧シークレット（タイポ名）
      process.env.STRIPE_WEBHOOK_SECRET_NEW,  // 追加シークレット候補
    ].filter(Boolean) as string[];
    
    // Ensure body is a Buffer for Stripe signature verification
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
    
    console.log('[Stripe Webhook] bodyType:', Buffer.isBuffer(req.body) ? 'buffer' : typeof req.body, '| bodyLen:', rawBody.length, '| candidates:', secretCandidates.length);
    
    if (secretCandidates.length === 0) {
      res.status(500).json({ error: "Webhook secret not configured" });
      return;
    }
    
    let event: import("stripe").Stripe.Event | null = null;
    let lastErr: unknown;
    for (const webhookSecret of secretCandidates) {
      try {
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
        console.log('[Stripe Webhook] Signature verified with secret prefix:', webhookSecret.slice(0, 12));
        break;
      } catch (err) {
        lastErr = err;
      }
    }
    if (!event) {
      console.error("[Stripe Webhook] All signature verifications failed:", lastErr);
      res.status(400).json({ error: "Invalid signature" });
      return;
    }
    // Handle test events
    if (event.id.startsWith("evt_test_")) {
      console.log("[Stripe Webhook] Test event detected, returning verification response");
      res.json({ verified: true });
      return;
    }
    try {
      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "DB not available" });
        return;
      }
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as import("stripe").Stripe.Checkout.Session;
          const sessionType = session.metadata?.type;

          if (sessionType === "host_registration") {
            // ─── Host registration fee payment ───
            const hostId = session.metadata?.host_id ? parseInt(session.metadata.host_id) : null;
            if (hostId) {
              // Update hostRegistrationPayments record
              await db.update(hostRegistrationPayments)
                .set({
                  status: "succeeded",
                  stripePaymentIntentId: (session.payment_intent as string) ?? null,
                  paidAt: new Date(),
                  updatedAt: new Date(),
                })
                .where(eq(hostRegistrationPayments.hostId, hostId));
              // Mark host as registration fee paid
              const { hosts: hostsTable } = await import("../../drizzle/schema");
              await db.update(hostsTable)
                .set({ registrationFeePaid: true, updatedAt: new Date() })
                .where(eq(hostsTable.id, hostId));
              console.log(`[Stripe Webhook] Host #${hostId} registration fee confirmed`);
              // Send confirmation email
              try {
                const { sendHostRegistrationFeeConfirmedEmail } = await import("../email");
                const customerEmail = session.metadata?.customer_email;
                const customerName = session.metadata?.customer_name ?? "ホスト";
                if (customerEmail) {
                  await sendHostRegistrationFeeConfirmedEmail({ to: customerEmail, hostName: customerName });
                }
              } catch (emailErr) {
                console.error("[Stripe Webhook] Failed to send host registration fee email:", emailErr);
              }
            }
          } else {
            // ─── Booking payment (full / deposit / final) ───
            const bookingId = session.metadata?.booking_id ? parseInt(session.metadata.booking_id) : null;
            const paymentType = (session.metadata?.payment_type ?? "full") as "deposit" | "final" | "full";
            if (bookingId) {
              const amountJpy = parseInt(session.metadata?.amount_jpy ?? "0");

              if (paymentType === "deposit") {
                // ─── STEP1: 20%仮押さえ完了 ───
                // 幂等性チェック：同じセッションIDのレコードがないか確認
                const existingDeposit = await db.select().from(payments)
                  .where(eq(payments.stripeSessionId, session.id)).limit(1);
                if (existingDeposit.length === 0) {
                  await db.insert(payments).values({
                    bookingId,
                    stripePaymentIntentId: (session.payment_intent as string) ?? null,
                    stripeSessionId: session.id,
                    amount: session.amount_total ?? 0,
                    amountJpy,
                    currency: session.currency?.toUpperCase() ?? "JPY",
                    paymentType: "deposit",
                    status: "succeeded",
                  });
                }
                // 予約のステータスを deposit_paid に更新
                await db.update(bookings)
                  .set({
                    status: "deposit_paid",
                    depositPaidAt: new Date(),
                    updatedAt: new Date(),
                  })
                  .where(eq(bookings.id, bookingId));
                console.log(`[Stripe Webhook] Booking #${bookingId} deposit (20%) paid`);
                // ゲストに仮押さえ完了メールを送信
                try {
                  const { users: usersTable, experiences: experiencesTable } = await import("../../drizzle/schema");
                  const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
                  if (booking) {
                    const [guest] = await db.select().from(usersTable).where(eq(usersTable.id, booking.guestId)).limit(1);
                    const [experience] = await db.select().from(experiencesTable).where(eq(experiencesTable.id, booking.experienceId)).limit(1);
                    if (guest?.email && experience) {
                      // 仮押さえ完了メール（ホスト調整中の旨を伝える）
                      const { sendEmail: _send } = await import("../email").catch(() => ({ sendEmail: null }));
                      const { Resend } = await import("resend").catch(() => ({ Resend: null }));
                      // sendGuestPaymentLinkEmailを仮押さえ完了通知として代用
                      const { sendGuestPaymentLinkEmail } = await import("../email");
                      await sendGuestPaymentLinkEmail({
                        to: guest.email,
                        guestName: guest.name ?? "ゲスト",
                        paymentLinkUrl: `https://www.yumhomestay.com/my/bookings`,
                        adultsCount: booking.adultsCount,
                        childrenCount: booking.childrenCount,
                        lang: guest.preferredLanguage ?? "ja",
                      });
                    }
                  }
                } catch (emailErr) {
                  console.error("[Stripe Webhook] Failed to send deposit confirmation email:", emailErr);
                }

              } else if (paymentType === "final") {
                // ─── STEP2: 80%本決済完了 ───
                const existingFinal = await db.select().from(payments)
                  .where(eq(payments.stripeSessionId, session.id)).limit(1);
                if (existingFinal.length === 0) {
                  await db.insert(payments).values({
                    bookingId,
                    stripePaymentIntentId: (session.payment_intent as string) ?? null,
                    stripeSessionId: session.id,
                    amount: session.amount_total ?? 0,
                    amountJpy,
                    currency: session.currency?.toUpperCase() ?? "JPY",
                    paymentType: "final",
                    status: "succeeded",
                  });
                }
                // 予約のステータスを confirmed に更新
                await db.update(bookings)
                  .set({
                    status: "confirmed",
                    confirmedAt: new Date(),
                    finalPaymentPaidAt: new Date(),
                    updatedAt: new Date(),
                  })
                  .where(eq(bookings.id, bookingId));
                console.log(`[Stripe Webhook] Booking #${bookingId} final payment (80%) completed → confirmed`);
                // 予約確定メールを送信
                try {
                  const { sendBookingConfirmationToGuest, sendHostBookingNotification } = await import("../email");
                  const { users: usersTable, experiences: experiencesTable, hosts: hostsTable } = await import("../../drizzle/schema");
                  const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
                  if (booking) {
                    const [guest] = await db.select().from(usersTable).where(eq(usersTable.id, booking.guestId)).limit(1);
                    const [experience] = await db.select().from(experiencesTable).where(eq(experiencesTable.id, booking.experienceId)).limit(1);
                    const [host] = await db.select().from(hostsTable).where(eq(hostsTable.id, experience?.hostId ?? 0)).limit(1);
                    const [hostUser] = host ? await db.select().from(usersTable).where(eq(usersTable.id, host.userId)).limit(1) : [];
                    const guestCount = booking.adultsCount + booking.childrenCount + (booking.infantsCount ?? 0);
                    if (guest?.email && experience) {
                      await sendBookingConfirmationToGuest({
                        to: guest.email,
                        guestName: guest.name ?? "ゲスト",
                        experienceTitle: experience.titleEn,
                        hostName: hostUser?.name ?? "ホスト",
                        startTime: booking.startTime,
                        guestCount,
                        totalAmountJpy: booking.amountJpy,
                        currency: booking.currency,
                        totalAmountForeign: booking.amountTotal / 100,
                        bookingId: booking.id,
                      });
                    }
                    if (hostUser?.email && experience) {
                      await sendHostBookingNotification({
                        to: hostUser.email,
                        hostName: hostUser?.name ?? "ホスト",
                        guestName: guest?.name ?? "ゲスト",
                        guestCountry: guest?.preferredLanguage ?? "不明",
                        experienceTitle: experience.titleEn,
                        startTime: booking.startTime,
                        guestCount,
                        hostPayoutJpy: booking.hostPayoutJpy,
                        bookingId: booking.id,
                      });
                    }
                  }
                } catch (emailErr) {
                  console.error("[Stripe Webhook] Failed to send final payment confirmation emails:", emailErr);
                }

              } else {
                // ─── 旧フロー互換: full決済 ───
                const [existing] = await db.select().from(payments).where(eq(payments.bookingId, bookingId)).limit(1);
                if (!existing) {
                  await db.insert(payments).values({
                    bookingId,
                    stripePaymentIntentId: (session.payment_intent as string) ?? null,
                    stripeSessionId: session.id,
                    amount: session.amount_total ?? 0,
                    amountJpy,
                    currency: session.currency?.toUpperCase() ?? "JPY",
                    paymentType: "full",
                    status: "succeeded",
                  });
                } else {
                  await db.update(payments)
                    .set({ status: "succeeded", stripeSessionId: session.id, updatedAt: new Date() })
                    .where(eq(payments.bookingId, bookingId));
                }
                await db.update(bookings)
                  .set({ status: "confirmed", confirmedAt: new Date(), updatedAt: new Date() })
                  .where(eq(bookings.id, bookingId));
                console.log(`[Stripe Webhook] Booking #${bookingId} confirmed after full payment`);
                try {
                  const { sendBookingConfirmationToGuest, sendHostBookingNotification } = await import("../email");
                  const { users: usersTable, experiences: experiencesTable, hosts: hostsTable } = await import("../../drizzle/schema");
                  const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
                  if (booking) {
                    const [guest] = await db.select().from(usersTable).where(eq(usersTable.id, booking.guestId)).limit(1);
                    const [experience] = await db.select().from(experiencesTable).where(eq(experiencesTable.id, booking.experienceId)).limit(1);
                    const [host] = await db.select().from(hostsTable).where(eq(hostsTable.id, experience?.hostId ?? 0)).limit(1);
                    const [hostUser] = host ? await db.select().from(usersTable).where(eq(usersTable.id, host.userId)).limit(1) : [];
                    const guestCount = booking.adultsCount + booking.childrenCount + (booking.infantsCount ?? 0);
                    if (guest?.email && experience) {
                      await sendBookingConfirmationToGuest({
                        to: guest.email,
                        guestName: guest.name ?? "ゲスト",
                        experienceTitle: experience.titleEn,
                        hostName: hostUser?.name ?? "ホスト",
                        startTime: booking.startTime,
                        guestCount,
                        totalAmountJpy: booking.amountJpy,
                        currency: booking.currency,
                        totalAmountForeign: booking.amountTotal / 100,
                        bookingId: booking.id,
                      });
                    }
                    if (hostUser?.email && experience) {
                      await sendHostBookingNotification({
                        to: hostUser.email,
                        hostName: hostUser?.name ?? "ホスト",
                        guestName: guest?.name ?? "ゲスト",
                        guestCountry: guest?.preferredLanguage ?? "不明",
                        experienceTitle: experience.titleEn,
                        startTime: booking.startTime,
                        guestCount,
                        hostPayoutJpy: booking.hostPayoutJpy,
                        bookingId: booking.id,
                      });
                    }
                  }
                } catch (emailErr) {
                  console.error("[Stripe Webhook] Failed to send booking confirmation emails:", emailErr);
                }
              }
            }
          }
          break;
        }
        case "checkout.session.expired": {
          const session = event.data.object as import("stripe").Stripe.Checkout.Session;
          const bookingId = session.metadata?.booking_id ? parseInt(session.metadata.booking_id) : null;
          if (bookingId) {
            // Revert to pending if session expired
            const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
            if (booking?.status === "pending_payment") {
              await db.update(bookings)
                .set({ status: "pending", updatedAt: new Date() })
                .where(eq(bookings.id, bookingId));
            }
          }
          break;
        }
        case "payment_intent.payment_failed": {
          const pi = event.data.object as import("stripe").Stripe.PaymentIntent;
          const bookingId = pi.metadata?.booking_id ? parseInt(pi.metadata.booking_id) : null;
          if (bookingId) {
            await db.update(bookings)
              .set({ status: "pending", updatedAt: new Date() })
              .where(eq(bookings.id, bookingId));
          }
          break;
        }
        // ─── Stripe Identity ────────────────────────────────────────────────
        case "identity.verification_session.verified": {
          const vs = event.data.object as import("stripe").Stripe.Identity.VerificationSession;
          const userId = vs.metadata?.user_id ? parseInt(vs.metadata.user_id) : null;
          if (userId) {
            const { kycSubmissions: kycTable } = await import("../../drizzle/schema");
            // Update kycSubmissions record
            await db.update(kycTable)
              .set({
                stripeVerificationStatus: "verified",
                status: "approved",
                reviewedAt: new Date(),
              })
              .where(eq(kycTable.stripeVerificationSessionId, vs.id));
            // Update user identityStatus
            const { users: usersTable } = await import("../../drizzle/schema");
            await db.update(usersTable)
              .set({ identityStatus: "verified" })
              .where(eq(usersTable.id, userId));
            console.log(`[Stripe Identity] User #${userId} verified via session ${vs.id}`);
          }
          break;
        }
        case "identity.verification_session.requires_input": {
          const vs = event.data.object as import("stripe").Stripe.Identity.VerificationSession;
          const userId = vs.metadata?.user_id ? parseInt(vs.metadata.user_id) : null;
          if (userId) {
            const { kycSubmissions: kycTable } = await import("../../drizzle/schema");
            await db.update(kycTable)
              .set({
                stripeVerificationStatus: "requires_input",
                status: "rejected",
                reviewNote: vs.last_error?.reason ?? "再提出が必要です",
                reviewedAt: new Date(),
              })
              .where(eq(kycTable.stripeVerificationSessionId, vs.id));
            const { users: usersTable } = await import("../../drizzle/schema");
            await db.update(usersTable)
              .set({ identityStatus: "failed" })
              .where(eq(usersTable.id, userId));
            console.log(`[Stripe Identity] User #${userId} requires_input for session ${vs.id}`);
          }
          break;
        }
        case "identity.verification_session.processing": {
          const vs = event.data.object as import("stripe").Stripe.Identity.VerificationSession;
          const { kycSubmissions: kycTable } = await import("../../drizzle/schema");
          await db.update(kycTable)
            .set({ stripeVerificationStatus: "processing" })
            .where(eq(kycTable.stripeVerificationSessionId, vs.id));
          break;
        }
        case "identity.verification_session.canceled": {
          const vs = event.data.object as import("stripe").Stripe.Identity.VerificationSession;
          const userId = vs.metadata?.user_id ? parseInt(vs.metadata.user_id) : null;
          const { kycSubmissions: kycTable } = await import("../../drizzle/schema");
          await db.update(kycTable)
            .set({ stripeVerificationStatus: "canceled", status: "rejected" })
            .where(eq(kycTable.stripeVerificationSessionId, vs.id));
          if (userId) {
            const { users: usersTable } = await import("../../drizzle/schema");
            await db.update(usersTable)
              .set({ identityStatus: "unverified" })
              .where(eq(usersTable.id, userId));
          }
          break;
        }
        default:
          console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
      }
      res.json({ received: true });
    } catch (err) {
      console.error("[Stripe Webhook] Processing error:", err);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });
}
