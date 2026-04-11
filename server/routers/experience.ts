import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import {
  createAuditLog,
  createExperience,
  getActiveExperiences,
  getExperienceById,
  getExperienceRatingSummary,
  getExperiencesByHostId,
  getHostByUserId,
  updateExperience,
} from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { cache, CACHE_KEYS, DEFAULT_TTL_SECONDS, SHORT_TTL_SECONDS } from "../cache";

export const experienceRouter = router({
  list: publicProcedure
    .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }).optional())
    .query(async ({ input }) => {
      const { limit = 20, offset = 0 } = input ?? {};
      // CTO: 一覧クエリは5分キャッシュ（トラフィックスパイク時のDB負荷軽減）
      const cacheKey = `${CACHE_KEYS.EXPERIENCES_ALL}:${limit}:${offset}`;
      return cache.getOrSet(cacheKey, () => getActiveExperiences(limit, offset), DEFAULT_TTL_SECONDS);
    }),

  getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    // CTO: 個別体験は5分キャッシュ
    const cacheKey = CACHE_KEYS.EXPERIENCES_BY_ID(input.id);
    const exp = await cache.getOrSet(cacheKey, () => getExperienceById(input.id), DEFAULT_TTL_SECONDS);
    if (!exp || exp.approvalStatus !== "approved") throw new TRPCError({ code: "NOT_FOUND" });
    return exp;
  }),

  getMyExperiences: protectedProcedure.query(async ({ ctx }) => {
    const host = await getHostByUserId(ctx.user.id);
    if (!host) return [];
    return getExperiencesByHostId(host.id);
  }),

  create: protectedProcedure
    .input(
      z.object({
        titleJa: z.string().optional(),
        titleEn: z.string().min(3),
        descriptionJa: z.string().optional(),
        descriptionEn: z.string().min(10),
        priceJpy: z.number().int().min(1000),
        durationMinutes: z.number().int().default(180),
        maxGuests: z.number().int().min(1).max(20).default(6),
        minGuests: z.number().int().min(1).default(1),
        cuisineType: z.string().optional(),
        dietaryOptions: z.array(z.string()).optional(),
        experienceType: z.enum(["cooking", "culture", "both"]).default("cooking"),
        cancellationPolicy: z.enum(["flexible", "moderate", "strict"]).default("moderate"),
        imageUrls: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const host = await getHostByUserId(ctx.user.id);
      if (!host) throw new TRPCError({ code: "FORBIDDEN", message: "Not registered as host" });
      if (host.approvalStatus !== "approved") throw new TRPCError({ code: "FORBIDDEN", message: "Host not approved" });

      await createExperience({
        hostId: host.id,
        titleJa: input.titleJa,
        titleEn: input.titleEn,
        descriptionJa: input.descriptionJa,
        descriptionEn: input.descriptionEn,
        priceJpy: input.priceJpy,
        durationMinutes: input.durationMinutes,
        maxGuests: input.maxGuests,
        minGuests: input.minGuests,
        cuisineType: input.cuisineType,
        dietaryOptions: input.dietaryOptions ? JSON.stringify(input.dietaryOptions) : undefined,
        experienceType: input.experienceType,
        cancellationPolicy: input.cancellationPolicy,
        imageUrls: input.imageUrls ? JSON.stringify(input.imageUrls) : undefined,
        approvalStatus: "pending",
        isActive: false,
      });

      // CTO: 体験作成後はキャッシュを無効化
      cache.delByPrefix("experiences:");

      await createAuditLog({
        userId: ctx.user.id,
        action: "experience.create",
        targetResource: "experiences",
        ipAddress: ctx.req.ip,
      });

      return { success: true };
    }),

  getRatingSummary: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      // CTO: 評価サマリーは1分キャッシュ（リアルタイム性を維持しつつDB負荷軽減）
      const cacheKey = CACHE_KEYS.RATING_SUMMARY(input.id);
      return cache.getOrSet(cacheKey, () => getExperienceRatingSummary(input.id), SHORT_TTL_SECONDS);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        titleJa: z.string().optional(),
        titleEn: z.string().optional(),
        descriptionJa: z.string().optional(),
        descriptionEn: z.string().optional(),
        priceJpy: z.number().int().optional(),
        durationMinutes: z.number().int().optional(),
        maxGuests: z.number().int().optional(),
        minGuests: z.number().int().optional(),
        cuisineType: z.string().optional(),
        dietaryOptions: z.array(z.string()).optional(),
        experienceType: z.enum(["cooking", "culture", "both"]).optional(),
        cancellationPolicy: z.enum(["flexible", "moderate", "strict"]).optional(),
        imageUrls: z.array(z.string()).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const host = await getHostByUserId(ctx.user.id);
      if (!host) throw new TRPCError({ code: "FORBIDDEN" });

      const exp = await getExperienceById(input.id);
      if (!exp || exp.hostId !== host.id) throw new TRPCError({ code: "FORBIDDEN" });

      const { id, dietaryOptions, imageUrls, ...rest } = input;
      const updateData: Record<string, unknown> = { ...rest };
      if (dietaryOptions) updateData.dietaryOptions = JSON.stringify(dietaryOptions);
      if (imageUrls) updateData.imageUrls = JSON.stringify(imageUrls);

      await updateExperience(id, updateData as Parameters<typeof updateExperience>[1]);

      // CTO: 体験更新後はキャッシュを無効化
      cache.del(CACHE_KEYS.EXPERIENCES_BY_ID(id));
      cache.delByPrefix("experiences:");

      return { success: true };
    }),
});
