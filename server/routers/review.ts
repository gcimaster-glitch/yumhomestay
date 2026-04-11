import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import {
  createAuditLog,
  createExperienceReview,
  createReview,
  getBookingById,
  getBookingsByGuestId,
  getCookingSchoolReviews,
  getCookingSchoolRatingSummary,
  getExperienceById,
  getExperienceReviewById,
  getExperienceReviews,
  getExperienceRatingSummary,
  getExperienceReviewsByHostId,
  getHostByUserId,
  getPublishedReviewsByRecipient,
  getReviewsByBookingId,
  hasUserReviewedCookingSchool,
  hasUserReviewedExperience,
  updateExperienceReview,
  updateReview,
} from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

export const reviewRouter = router({
  // Public: get published reviews for a user
  getByRecipient: publicProcedure
    .input(z.object({ recipientId: z.number() }))
    .query(async ({ input }) => {
      return getPublishedReviewsByRecipient(input.recipientId);
    }),

  // Protected: submit review (blind review system)
  submit: protectedProcedure
    .input(
      z.object({
        bookingId: z.number(),
        ratingOverall: z.number().int().min(1).max(5),
        ratingCleanliness: z.number().int().min(1).max(5).optional(),
        ratingAccuracy: z.number().int().min(1).max(5).optional(),
        ratingCommunication: z.number().int().min(1).max(5).optional(),
        commentPublic: z.string().max(1000).optional(),
        commentPrivate: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const booking = await getBookingById(input.bookingId);
      if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
      if (booking.status !== "completed") throw new TRPCError({ code: "BAD_REQUEST", message: "Booking not completed" });

      const host = await getHostByUserId(ctx.user.id);
      const isGuest = booking.guestId === ctx.user.id;
      const isHost = host && booking.hostId === host.id;

      if (!isGuest && !isHost) throw new TRPCError({ code: "FORBIDDEN" });

      // Check for duplicate review
      const existing = await getReviewsByBookingId(input.bookingId);
      const authorType = isGuest ? "guest" : "host";
      const alreadyReviewed = existing.some((r: (typeof existing)[0]) => r.authorId === ctx.user.id && r.authorType === authorType);
      if (alreadyReviewed) throw new TRPCError({ code: "CONFLICT", message: "Already submitted review" });

      const recipientId = isGuest
        ? (host?.userId ?? booking.hostId)
        : booking.guestId;

      await createReview({
        bookingId: input.bookingId,
        authorId: ctx.user.id,
        recipientId,
        authorType,
        ratingOverall: input.ratingOverall,
        ratingCleanliness: input.ratingCleanliness,
        ratingAccuracy: input.ratingAccuracy,
        ratingCommunication: input.ratingCommunication,
        commentPublic: input.commentPublic,
        commentPrivate: input.commentPrivate,
        isBlind: true,
        isPublished: false,
      });

      // Check if both sides have reviewed → publish both
      const updatedReviews = await getReviewsByBookingId(input.bookingId);
      const guestReview = updatedReviews.find((r: (typeof updatedReviews)[0]) => r.authorType === "guest");
      const hostReview = updatedReviews.find((r: (typeof updatedReviews)[0]) => r.authorType === "host");

      if (guestReview && hostReview) {
        // Both submitted → publish both (blind review complete)
        await updateReview(guestReview.id, { isPublished: true, publishedAt: new Date() });
        await updateReview(hostReview.id, { isPublished: true, publishedAt: new Date() });
      }

      await createAuditLog({
        userId: ctx.user.id,
        action: "review.submit",
        targetResource: "reviews",
        targetId: String(input.bookingId),
        ipAddress: ctx.req.ip,
      });

      return { success: true, bothSubmitted: !!(guestReview && hostReview) };
    }),

  // Protected: get reviews for a booking (only visible after both submitted)
  getByBooking: protectedProcedure
    .input(z.object({ bookingId: z.number() }))
    .query(async ({ ctx, input }) => {
      const booking = await getBookingById(input.bookingId);
      if (!booking) throw new TRPCError({ code: "NOT_FOUND" });

      const host = await getHostByUserId(ctx.user.id);
      const isGuest = booking.guestId === ctx.user.id;
      const isHost = host && booking.hostId === host.id;
      const isAdmin = ctx.user.role === "admin";

      if (!isGuest && !isHost && !isAdmin) throw new TRPCError({ code: "FORBIDDEN" });

      const reviews = await getReviewsByBookingId(input.bookingId);

      // Non-admin: only show published reviews
      if (!isAdmin) return reviews.filter((r: (typeof reviews)[0]) => r.isPublished);
      return reviews;
    }),

  // ─── Experience Reviews (public口コミ) ──────────────────────────────────────

  // Public: get reviews for an experience
  getByExperience: publicProcedure
    .input(z.object({ experienceId: z.number(), limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      const [reviews, summary] = await Promise.all([
        getExperienceReviews(input.experienceId, input.limit, input.offset),
        getExperienceRatingSummary(input.experienceId),
      ]);
      return { reviews, summary };
    }),

  // Public: get reviews for a cooking school
  getByCookingSchool: publicProcedure
    .input(z.object({ cookingSchoolId: z.number(), limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      const [reviews, summary] = await Promise.all([
        getCookingSchoolReviews(input.cookingSchoolId, input.limit, input.offset),
        getCookingSchoolRatingSummary(input.cookingSchoolId),
      ]);
      return { reviews, summary };
    }),

  // Protected: submit experience review
  // バリデーション: ゲストが当該体験のcompletedな予約を持っていることを確認
  submitExperienceReview: protectedProcedure
    .input(
      z.object({
        experienceId: z.number().optional(),
        cookingSchoolId: z.number().optional(),
        ratingOverall: z.number().int().min(1).max(5),
        ratingFood: z.number().int().min(1).max(5).optional(),
        ratingHost: z.number().int().min(1).max(5).optional(),
        ratingValue: z.number().int().min(1).max(5).optional(),
        titleJa: z.string().max(255).optional(),
        titleEn: z.string().max(255).optional(),
        commentJa: z.string().max(2000).optional(),
        commentEn: z.string().max(2000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!input.experienceId && !input.cookingSchoolId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "experienceId or cookingSchoolId is required" });
      }

      // 体験後のみ投稿可能バリデーション: completedな予約が存在するか確認
      const guestBookings = await getBookingsByGuestId(ctx.user.id);
      if (input.experienceId) {
        const hasCompletedBooking = guestBookings.some(
          (b: (typeof guestBookings)[0]) => b.experienceId === input.experienceId && b.status === "completed"
        );
        if (!hasCompletedBooking) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only review an experience after completing a booking",
          });
        }
      }
      // cookingSchoolId の場合は booking.experienceId 経由での確認は難しいため
      // 重複チェックのみ実施（料理教室予約はguestInquiriesで管理）

      // Duplicate check
      if (input.experienceId) {
        const already = await hasUserReviewedExperience(ctx.user.id, input.experienceId);
        if (already) throw new TRPCError({ code: "CONFLICT", message: "Already reviewed this experience" });
      }
      if (input.cookingSchoolId) {
        const already = await hasUserReviewedCookingSchool(ctx.user.id, input.cookingSchoolId);
        if (already) throw new TRPCError({ code: "CONFLICT", message: "Already reviewed this cooking school" });
      }

      await createExperienceReview({
        experienceId: input.experienceId ?? null,
        cookingSchoolId: input.cookingSchoolId ?? null,
        authorId: ctx.user.id,
        authorName: ctx.user.name ?? "Anonymous",
        ratingOverall: input.ratingOverall,
        ratingFood: input.ratingFood ?? null,
        ratingHost: input.ratingHost ?? null,
        ratingValue: input.ratingValue ?? null,
        titleJa: input.titleJa ?? null,
        titleEn: input.titleEn ?? null,
        commentJa: input.commentJa ?? null,
        commentEn: input.commentEn ?? null,
        isPublished: true,
        isFlagged: false,
      });

      return { success: true };
    }),

  // Protected: ホストが自分の体験へのレビューに返信する
  hostReplyToReview: protectedProcedure
    .input(
      z.object({
        reviewId: z.number(),
        reply: z.string().min(1).max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const review = await getExperienceReviewById(input.reviewId);
      if (!review) throw new TRPCError({ code: "NOT_FOUND", message: "Review not found" });

      // ホスト権限確認: このレビューの対象体験を所有するホストのみ返信可能
      const host = await getHostByUserId(ctx.user.id);
      if (!host) throw new TRPCError({ code: "FORBIDDEN", message: "Host account required" });

      // experienceIdが設定されている場合、そのexperienceのhostIdを確認
      if (review.experienceId) {
        const exp = await getExperienceById(review.experienceId);
        if (!exp || exp.hostId !== host.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to reply to this review" });
        }
      }

      // 既に返信済みの場合は上書き可能（最新の返信を保持）
      await updateExperienceReview(input.reviewId, {
        replyByHost: input.reply,
        repliedAt: new Date(),
      });

      await createAuditLog({
        userId: ctx.user.id,
        action: "review.host_reply",
        targetResource: "experienceReviews",
        targetId: String(input.reviewId),
        ipAddress: ctx.req.ip,
      });

      return { success: true };
    }),

  // Protected: ホストが自分の体験へのレビュー一覧を取得する
  getMyHostReviews: protectedProcedure.query(async ({ ctx }) => {
    const host = await getHostByUserId(ctx.user.id);
    if (!host) throw new TRPCError({ code: "FORBIDDEN", message: "Host account required" });
    return getExperienceReviewsByHostId(host.id);
  }),
});
