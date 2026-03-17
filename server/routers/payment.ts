import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import {
  createAuditLog,
  createPayment,
  getBookingById,
  getBookingsByHostId,
  getHostByUserId,
  getLatestExchangeRate,
  updateBooking,
  updatePaymentByIntentId,
  upsertExchangeRate,
} from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

// Supported currencies for display
const SUPPORTED_CURRENCIES = ["JPY", "USD", "EUR", "GBP", "AUD", "SGD", "CNY", "KRW", "TWD", "HKD"];

export const paymentRouter = router({
  // Get supported currencies with latest rates
  getCurrencies: publicProcedure.query(async () => {
    const rates: Record<string, number> = { JPY: 1 };
    for (const currency of SUPPORTED_CURRENCIES.filter((c) => c !== "JPY")) {
      const rate = await getLatestExchangeRate(currency);
      if (rate) rates[currency] = Number(rate.rateToJpy);
    }
    return { currencies: SUPPORTED_CURRENCIES, rates };
  }),

  // Create Stripe Payment Intent
  createIntent: protectedProcedure
    .input(z.object({ bookingId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const booking = await getBookingById(input.bookingId);
      if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
      if (booking.guestId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (booking.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "Booking not in pending state" });

      // Check if Stripe is configured
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) {
        // Return mock intent for development
        const mockIntentId = `pi_mock_${Date.now()}`;
        await createPayment({
          bookingId: booking.id,
          stripePaymentIntentId: mockIntentId,
          amount: booking.amountTotal,
          currency: booking.currency,
          amountJpy: booking.amountJpy,
          status: "requires_payment_method",
        });
        return {
          clientSecret: `${mockIntentId}_secret_mock`,
          paymentIntentId: mockIntentId,
          amount: booking.amountTotal,
          currency: booking.currency,
          isMock: true,
        };
      }

      // Real Stripe integration
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(stripeKey);

      const intent = await stripe.paymentIntents.create({
        amount: booking.amountTotal,
        currency: booking.currency.toLowerCase(),
        metadata: {
          bookingId: String(booking.id),
          guestId: String(ctx.user.id),
        },
      });

      await createPayment({
        bookingId: booking.id,
        stripePaymentIntentId: intent.id,
        amount: booking.amountTotal,
        currency: booking.currency,
        amountJpy: booking.amountJpy,
        status: "requires_payment_method",
      });

      await createAuditLog({
        userId: ctx.user.id,
        action: "payment.create_intent",
        targetResource: "payments",
        targetId: intent.id,
        ipAddress: ctx.req.ip,
      });

      return {
        clientSecret: intent.client_secret,
        paymentIntentId: intent.id,
        amount: booking.amountTotal,
        currency: booking.currency,
        isMock: false,
      };
    }),

  // Confirm payment (called after Stripe confirms)
  confirmPayment: protectedProcedure
    .input(z.object({ paymentIntentId: z.string(), bookingId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const booking = await getBookingById(input.bookingId);
      if (!booking || booking.guestId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      await updatePaymentByIntentId(input.paymentIntentId, { status: "succeeded" });
      await updateBooking(input.bookingId, { status: "confirmed", confirmedAt: new Date() });

      await createAuditLog({
        userId: ctx.user.id,
        action: "payment.confirm",
        targetResource: "payments",
        targetId: input.paymentIntentId,
        ipAddress: ctx.req.ip,
      });

      return { success: true };
    }),

  // Host: payout summary
  hostPayoutSummary: protectedProcedure.query(async ({ ctx }) => {
    const host = await getHostByUserId(ctx.user.id);
    if (!host) return { currentMonthJpy: 0, lastMonthJpy: 0, totalJpy: 0, pendingJpy: 0, currentMonthBookings: 0, lastMonthBookings: 0 };

    const allBookings = await getBookingsByHostId(host.id);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    let currentMonthJpy = 0;
    let lastMonthJpy = 0;
    let totalJpy = 0;
    let pendingJpy = 0;
    let currentMonthBookings = 0;
    let lastMonthBookings = 0;

    for (const b of allBookings) {
      const payout = b.hostPayoutJpy ?? 0;
      if (b.status === "completed") {
        totalJpy += payout;
        const completedAt = b.completedAt ? new Date(b.completedAt) : null;
        if (completedAt && completedAt >= startOfMonth) {
          currentMonthJpy += payout;
          currentMonthBookings += 1;
        } else if (completedAt && completedAt >= startOfLastMonth && completedAt < startOfMonth) {
          lastMonthJpy += payout;
          lastMonthBookings += 1;
        }
      } else if (b.status === "confirmed") {
        pendingJpy += payout;
      }
    }

    return { currentMonthJpy, lastMonthJpy, totalJpy, pendingJpy, currentMonthBookings, lastMonthBookings };
  }),

  // Refresh exchange rates (admin or cron)
  refreshExchangeRates: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });

    try {
      // Use free exchange rate API
      const response = await fetch("https://api.exchangerate-api.com/v4/latest/JPY");
      if (response.ok) {
        const data = (await response.json()) as { rates: Record<string, number> };
        for (const currency of SUPPORTED_CURRENCIES.filter((c) => c !== "JPY")) {
          const rateFromJpy = data.rates[currency];
          if (rateFromJpy) {
            // Store as rate TO JPY (inverse)
            await upsertExchangeRate(currency, 1 / rateFromJpy);
          }
        }
      }
    } catch (e) {
      console.error("[ExchangeRate] Failed to fetch:", e);
    }

    return { success: true };
  }),
});

// Re-export with added procedures via extension
// NOTE: hostPayoutSummary added below
