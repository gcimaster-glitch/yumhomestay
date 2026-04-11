import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import {
  createAuditLog,
  createBooking,
  createNotification,
  getAgentByUserId,
  getBookingById,
  getBookingsByAgentId,
  getBookingsByGuestId,
  getBookingsByHostId,
  getExperienceById,
  getHostByUserId,
  getLatestExchangeRate,
  getPaymentByBookingId,
  updateBooking,
  updatePayment,
} from "../db";
import { calcRefund } from "../../shared/cancellation";
import { protectedProcedure, router } from "../_core/trpc";
import {
  YHS_BASE_PRICE_JPY,
  YHS_EXTRA_ADULT_JPY,
  YHS_EXTRA_CHILD_JPY,
  YHS_EXTRA_INFANT_JPY,
  YHS_AGENT_FEE_JPY,
  YHS_HOST_PAYOUT_JPY,
  YHS_CARD_FEE_RATE,
  YHS_AFFILIATE_FEE_JPY,
  calcTotalSalesJpy,
  calcProfitBreakdown,
} from "../../shared/pricing";

export const bookingRouter = router({
  // Guest: list my bookings
  myBookings: protectedProcedure.query(async ({ ctx }) => {
    return getBookingsByGuestId(ctx.user.id);
  }),

  // Host: list bookings for my experiences
  hostBookings: protectedProcedure.query(async ({ ctx }) => {
    const host = await getHostByUserId(ctx.user.id);
    if (!host) return [];
    return getBookingsByHostId(host.id);
  }),

  // Agent: list bookings referred by my agency
  agentBookings: protectedProcedure.query(async ({ ctx }) => {
    const agent = await getAgentByUserId(ctx.user.id);
    if (!agent) return [];
    return getBookingsByAgentId(agent.id);
  }),

  // Agent: get my agent profile
  getMyAgent: protectedProcedure.query(async ({ ctx }) => {
    const agent = await getAgentByUserId(ctx.user.id);
    return agent ?? null;
  }),

  // Get single booking
  getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const booking = await getBookingById(input.id);
    if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
    // Only guest, host, or admin can view
    const host = await getHostByUserId(ctx.user.id);
    const isGuest = booking.guestId === ctx.user.id;
    const isHost = host && booking.hostId === host.id;
    const isAdmin = ctx.user.role === "admin";
    if (!isGuest && !isHost && !isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
    return booking;
  }),

  // Guest: create booking request
  create: protectedProcedure
    .input(
      z.object({
        experienceId: z.number(),
        startTime: z.string(), // ISO string
        adultsCount: z.number().int().min(2).default(2), // YHS: base 2 adults
        childrenCount: z.number().int().min(0).default(0), // age 5+
        infantsCount: z.number().int().min(0).default(0), // under 5
        currency: z.string().length(3).default("JPY"),
        dietaryRestrictions: z.string().optional(),
        specialRequests: z.string().optional(),
        agentId: z.number().optional(),
        pickupStation: z.string().optional(),
        videoCallPreferredTimes: z.array(z.string()).min(1, "ビデオ面談希望日時を1つ以上入力してください").optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const exp = await getExperienceById(input.experienceId);
      if (!exp || !exp.isActive) throw new TRPCError({ code: "NOT_FOUND", message: "体験が見つかりません" });

      const totalGuests = input.adultsCount + input.childrenCount + input.infantsCount;
      if (totalGuests > exp.maxGuests) throw new TRPCError({ code: "BAD_REQUEST", message: "参加人数が上限を超えています" });
      if (input.adultsCount < 2) throw new TRPCError({ code: "BAD_REQUEST", message: "2名以上でのご参加が必要です（YHSルール）" });

      // YHS Fixed Pricing Calculation (shared/pricing.ts)
      const extraAdults = Math.max(0, input.adultsCount - 2); // adults beyond base 2
      const basePriceJpy = YHS_BASE_PRICE_JPY;                // ¥55,000 (2名基本)
      const extraAdultPriceJpy = extraAdults * YHS_EXTRA_ADULT_JPY;          // ¥22,000/名
      const extraChildPriceJpy = input.childrenCount * YHS_EXTRA_CHILD_JPY;  // ¥11,000/名
      const extraInfantPriceJpy = input.infantsCount * YHS_EXTRA_INFANT_JPY; // ¥5,500/名
      const priceJpy = basePriceJpy + extraAdultPriceJpy + extraChildPriceJpy + extraInfantPriceJpy;

      // 収益内訳計算 (calcProfitBreakdown)
      const hasAgent = !!input.agentId;
      const breakdown = calcProfitBreakdown(priceJpy, hasAgent);
      const agentFeeJpy = breakdown.agentFeeJpy;         // ¥8,800 or 0
      const hostPayoutJpy = breakdown.hostPayoutJpy;     // ¥25,000（固定：報酬20,000+原価5,000）
      const cardFeeJpy = breakdown.cardFeeJpy;           // 売上の5%
      const affiliateFeeJpy = breakdown.affiliateFeeJpy; // ¥2,200
      const platformProfitJpy = breakdown.platformProfitJpy;
      // serviceFeeJpy = カード手数料 + 代理店手数料 + アフィリエイト手数料（プラットフォーム収益計上用）
      const serviceFeeJpy = agentFeeJpy + cardFeeJpy + affiliateFeeJpy;

      let amountTotal = priceJpy;
      let exchangeRate = 1.0;

      if (input.currency !== "JPY") {
        const rate = await getLatestExchangeRate(input.currency);
        if (rate) {
          exchangeRate = 1 / Number(rate.rateToJpy);
          amountTotal = Math.round(priceJpy * exchangeRate);
        }
      }

      const startTime = new Date(input.startTime);
      // YHS: 4h total (30min pickup + 10min intro + 3h experience + 20min after)
      const endTime = new Date(startTime.getTime() + 4 * 60 * 60 * 1000);

      const bookingResult = await createBooking({
        guestId: ctx.user.id,
        hostId: exp.hostId,
        experienceId: exp.id,
        agentId: input.agentId,
        startTime,
        endTime,
        adultsCount: input.adultsCount,
        childrenCount: input.childrenCount,
        infantsCount: input.infantsCount,
        basePriceJpy,
        extraAdultPriceJpy,
        extraChildPriceJpy,
        extraInfantPriceJpy,
        amountTotal,
        currency: input.currency,
        exchangeRateToJpy: exchangeRate.toFixed(6),
        amountJpy: priceJpy,
        serviceFeeJpy,
        hostPayoutJpy,
        agentFeeJpy,
        agentBonusFeeJpy: 0, // calculated at month-end
        cardFeeJpy,
        affiliateFeeJpy,
        platformProfitJpy,
        pickupStation: input.pickupStation,
        dietaryRestrictions: input.dietaryRestrictions,
        specialRequests: input.videoCallPreferredTimes
          ? `[ビデオ面談希望日時] ${input.videoCallPreferredTimes.join(" / ")}${input.specialRequests ? " | " + input.specialRequests : ""}`
          : input.specialRequests,
        status: "pending",
      });

      const newBookingId = bookingResult[0]?.insertId as number;

      await createAuditLog({
        userId: ctx.user.id,
        action: "booking.create",
        targetResource: "bookings",
        ipAddress: ctx.req.ip,
      });

      return { success: true, id: newBookingId };
    }),

  // Host: confirm booking
  confirm: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const booking = await getBookingById(input.id);
      if (!booking) throw new TRPCError({ code: "NOT_FOUND" });

      const host = await getHostByUserId(ctx.user.id);
      if (!host || booking.hostId !== host.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (booking.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "Booking not pending" });

      await updateBooking(input.id, { status: "confirmed", confirmedAt: new Date() });

      await createNotification({
        userId: booking.guestId,
        type: "booking_confirmed",
        titleJa: "予約が確定しました",
        titleEn: "Booking Confirmed",
        bodyJa: `予約ID #${booking.id} が確定しました。`,
        bodyEn: `Your booking #${booking.id} has been confirmed.`,
        relatedBookingId: booking.id,
      });

      await createAuditLog({
        userId: ctx.user.id,
        action: "booking.confirm",
        targetResource: "bookings",
        targetId: String(input.id),
        ipAddress: ctx.req.ip,
      });

      return { success: true };
    }),

  // Guest or Host: cancel booking
  cancel: protectedProcedure
    .input(z.object({ id: z.number(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const booking = await getBookingById(input.id);
      if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
      const host = await getHostByUserId(ctx.user.id);
      const isGuest = booking.guestId === ctx.user.id;
      const isHost = host && booking.hostId === host.id;
      const isAdmin = ctx.user.role === "admin";
      if (!isGuest && !isHost && !isAdmin) throw new TRPCError({ code: "FORBIDDEN" });

      // キャンセル可能なステータスかチェック（完了済み・既キャンセルは不可）
      const nonCancellableStatuses = ["completed", "cancelled_by_guest", "cancelled_by_host", "cancelled_by_admin"];
      if (nonCancellableStatuses.includes(booking.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This booking cannot be cancelled." });
      }

      const cancelledBy: "guest" | "host" | "admin" = isAdmin ? "admin" : isGuest ? "guest" : "host";
      const cancelStatus = isAdmin
        ? "cancelled_by_admin"
        : isGuest
          ? "cancelled_by_guest"
          : "cancelled_by_host";

      // ─── Stripe 自動返金処理 ─────────────────────────────────────────────────
      let refundAmountJpy = 0;
      let refundResult = null;
      const payment = await getPaymentByBookingId(input.id);

      if (payment && payment.status === "succeeded" && payment.stripePaymentIntentId) {
        // 体験情報を取得してキャンセルポリシーを確認
        const experience = await getExperienceById(booking.experienceId);
        const policy = (experience?.cancellationPolicy ?? "moderate") as "flexible" | "moderate" | "strict";

        // 返金額を計算
        refundResult = calcRefund(policy, booking.startTime, booking.amountJpy, cancelledBy);
        refundAmountJpy = refundResult.refundAmountJpy;

        if (!refundResult.noRefund && refundAmountJpy > 0) {
          try {
            const stripeKey = process.env.STRIPE_SECRET_KEY;
            if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
            const Stripe = (await import("stripe")).default;
            const stripe = new Stripe(stripeKey);

            // Stripe Refund API を呼び出す
            // JPY は minor unit が 1円 = 1 なのでそのまま渡す
            const refund = await stripe.refunds.create({
              payment_intent: payment.stripePaymentIntentId,
              amount: refundAmountJpy, // JPY: 1 unit = 1 yen
              reason: "requested_by_customer",
              metadata: {
                booking_id: String(booking.id),
                cancelled_by: cancelledBy,
                refund_reason: refundResult.reason,
              },
            });

            // paymentsテーブルを更新
            await updatePayment(payment.id, {
              status: refundAmountJpy >= booking.amountJpy ? "refunded" : "succeeded",
              refundedAt: new Date(),
              refundReason: refundResult.reason,
            });

            console.log(`[Booking Cancel] Stripe refund created: refund_id=${refund.id}, booking_id=${booking.id}, amount_jpy=${refundAmountJpy}`);
          } catch (refundErr) {
            // 返金失敗はシステムエラーとして記録するが、キャンセル自体は続行する
            // （管理者が手動で対応できるよう監査ログに記録）
            console.error(`[Booking Cancel] Stripe refund FAILED for booking #${booking.id}:`, refundErr);
            await createAuditLog({
              userId: ctx.user.id,
              action: "booking.refund_failed",
              targetResource: "bookings",
              targetId: String(input.id),
              payload: JSON.stringify({
                error: String(refundErr),
                refundAmountJpy,
                paymentIntentId: payment.stripePaymentIntentId,
              }),
              ipAddress: ctx.req.ip,
            });
          }
        }
      }
      // ────────────────────────────────────────────────────────────────────────

      await updateBooking(input.id, {
        status: cancelStatus,
        cancelledAt: new Date(),
        cancellationReason: input.reason,
      });

      await createAuditLog({
        userId: ctx.user.id,
        action: "booking.cancel",
        targetResource: "bookings",
        targetId: String(input.id),
        payload: JSON.stringify({
          reason: input.reason,
          cancelledBy,
          refundAmountJpy,
          refundReason: refundResult?.reason ?? "no_payment",
        }),
        ipAddress: ctx.req.ip,
      });

      return {
        success: true,
        refundAmountJpy,
        refundReason: refundResult?.reason ?? null,
      };
    }),

  // Guest: submit post-completion survey
  submitSurvey: protectedProcedure
    .input(
      z.object({
        bookingId: z.number(),
        rating: z.number().int().min(1).max(5),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const booking = await getBookingById(input.bookingId);
      if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
      if (booking.guestId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (booking.status !== "completed") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Booking must be completed before submitting survey" });
      }
      if (booking.guestSurveySubmittedAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Survey already submitted" });
      }

      await updateBooking(input.bookingId, {
        guestSurveyRating: input.rating,
        guestSurveyComment: input.comment,
        guestSurveySubmittedAt: new Date(),
      });

      await createAuditLog({
        userId: ctx.user.id,
        action: "booking.submitSurvey",
        targetResource: "bookings",
        targetId: String(input.bookingId),
        ipAddress: ctx.req.ip,
      });

      return { success: true };
    }),

  // Admin/Host: mark as completed
  complete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const booking = await getBookingById(input.id);
      if (!booking) throw new TRPCError({ code: "NOT_FOUND" });

      const host = await getHostByUserId(ctx.user.id);
      const isHost = host && booking.hostId === host.id;
      const isAdmin = ctx.user.role === "admin";

      if (!isHost && !isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
      if (booking.status !== "confirmed") throw new TRPCError({ code: "BAD_REQUEST" });

      await updateBooking(input.id, { status: "completed", completedAt: new Date() });

      // Notify guest to leave review
      await createNotification({
        userId: booking.guestId,
        type: "booking_completed",
        titleJa: "体験が完了しました！レビューをお願いします",
        titleEn: "Experience Completed! Please leave a review",
        bodyJa: `体験 #${booking.id} が完了しました。ぜひレビューをお願いします。`,
        bodyEn: `Your experience #${booking.id} is complete. Please share your feedback.`,
        relatedBookingId: booking.id,
      });

      await createAuditLog({
        userId: ctx.user.id,
        action: "booking.complete",
        targetResource: "bookings",
        targetId: String(input.id),
        ipAddress: ctx.req.ip,
      });

      return { success: true };
    }),
});
