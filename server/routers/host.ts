import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import {
  createAuditLog,
  createHost,
  getApprovedHosts,
  getAllHosts,
  getHostById,
  getHostByUserId,
  getUserById,
  updateHost,
  updateUser,
} from "../db";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { cache, CACHE_KEYS, DEFAULT_TTL_SECONDS } from "../cache";

export const hostRouter = router({
  // Public: list approved hosts
  list: publicProcedure
    .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }).optional())
    .query(async ({ input }) => {
      const { limit = 20, offset = 0 } = input ?? {};
      // CTO: ホスト一覧は5分キャッシュ（トラフィックスパイク時のDB負荷軽減）
      const cacheKey = `${CACHE_KEYS.HOSTS_APPROVED}:${limit}:${offset}`;
      return cache.getOrSet(cacheKey, () => getApprovedHosts(limit, offset), DEFAULT_TTL_SECONDS);
    }),

  // Public: get host detail
  getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    // CTO: ホスト詳細は5分キャッシュ
    const cacheKey = CACHE_KEYS.HOST_BY_ID(input.id);
    const host = await cache.getOrSet(cacheKey, () => getHostById(input.id), DEFAULT_TTL_SECONDS);
    if (!host || host.approvalStatus !== "approved") throw new TRPCError({ code: "NOT_FOUND" });
    const { addressEncrypted, ...safe } = host;
    return safe;
  }),

  // Protected: get own host profile
  getMyHost: protectedProcedure.query(async ({ ctx }) => {
    const host = await getHostByUserId(ctx.user.id);
    return host ?? null;
  }),

  // Protected: register as host (YHS spec-compliant)
  register: protectedProcedure
    .input(
      z.object({
        // Basic profile
        bioJa: z.string().optional(),
        bioEn: z.string().min(10, "自己紹介（英語）は10文字以上で入力してください"),
        nearestStation: z.string().min(1, "最寄り駅を入力してください"),
        prefecture: z.string().min(1, "都道府県を入力してください"),
        city: z.string().min(1, "市区町村を入力してください"),
        languages: z.array(z.string()).min(1, "対応言語を1つ以上選択してください"),
        profileImageUrl: z.string().optional(),
        // YHS Required fields (spec-compliant)
        familyMemberCount: z.number().int().min(2, "家族は最低2名必要です（ホスト本人含む）"),
        hasInsurance: z.boolean().refine((v) => v === true, {
          message: "損害賠償保険への加入が必須です",
        }),
        agreedToRegistrationFee: z.boolean().refine((v) => v === true, {
          message: "登録料¥5,000の支払いに同意が必要です",
        }),
        agreedToTerms: z.boolean().refine((v) => v === true, {
          message: "利用規約への同意が必要です",
        }),
        // ZOOM interview preferences (3 slots)
        interviewPreference1: z.string().min(1, "第1希望の面談日時を入力してください"),
        interviewPreference2: z.string().optional(),
        interviewPreference3: z.string().optional(),
        // Optional
        dietaryAccommodations: z.array(z.string()).optional(),
        canCookTogether: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await getHostByUserId(ctx.user.id);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Already registered as host" });

      // Store interview preferences
      const interviewPrefs = [
        input.interviewPreference1,
        input.interviewPreference2,
        input.interviewPreference3,
      ]
        .filter(Boolean)
        .join(" / ");

      await createHost({
        userId: ctx.user.id,
        bioJa: input.bioJa,
        bioEn: input.bioEn,
        nearestStation: input.nearestStation,
        prefecture: input.prefecture,
        city: input.city,
        languages: JSON.stringify(input.languages),
        profileImageUrl: input.profileImageUrl,
        familyMemberCount: input.familyMemberCount,
        hasInsurance: input.hasInsurance,
        canCookTogether: input.canCookTogether,
        dietaryAccommodations: input.dietaryAccommodations
          ? JSON.stringify(input.dietaryAccommodations)
          : null,
        certificationDetails: `ZOOM面談希望日時: ${interviewPrefs}`,
        approvalStatus: "pending",
        isActive: false,
      });

      await updateUser(ctx.user.id, { userType: "host" });

      await createAuditLog({
        userId: ctx.user.id,
        action: "host.register",
        targetResource: "hosts",
        ipAddress: ctx.req.ip,
      });

      // Send registration received email
      try {
        if (ctx.user.email) {
          const { sendHostRegistrationReceivedEmail } = await import("../email");
          const origin = (ctx.req.headers.origin as string) ?? "https://yumhomestay.com";
          await sendHostRegistrationReceivedEmail({
            to: ctx.user.email,
            hostName: ctx.user.name ?? "ホスト",
            interviewPrefs: interviewPrefs,
            paymentUrl: `${origin}/host/register?step=payment`,
          });
        }
      } catch (emailErr) {
        console.error("[Host Register] Failed to send registration received email:", emailErr);
      }

      return { success: true };
    }),

  // Admin: list all hosts
  adminList: adminProcedure
    .input(z.object({
      limit: z.number().default(50),
      offset: z.number().default(0),
      status: z.enum(["pending", "interview", "approved", "rejected", "suspended", "all"]).default("all"),
    }).optional())
    .query(async ({ input }) => {
      const { limit = 50, offset = 0, status = "all" } = input ?? {};
      const allHosts = await getAllHosts(limit, offset);
      if (status === "all") return allHosts;
      return allHosts.filter((h: (typeof allHosts)[0]) => h.approvalStatus === status);
    }),

  // Admin: approve host
  adminApprove: adminProcedure
    .input(z.object({ hostId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const host = await getHostById(input.hostId);
      if (!host) throw new TRPCError({ code: "NOT_FOUND" });

      await updateHost(input.hostId, {
        approvalStatus: "approved",
        approvedAt: new Date(),
        approvedBy: ctx.user.id,
        isActive: true,
        certificationIssuedAt: new Date(),
      });

      await createAuditLog({
        userId: ctx.user.id,
        action: "host.approve",
        targetResource: "hosts",
        targetId: input.hostId.toString(),
        ipAddress: ctx.req.ip,
      });

      // Send approval email with certification
      try {
        const hostUser = await getUserById(host.userId);
        if (hostUser?.email) {
          const { sendHostApprovedEmail } = await import("../email");
          const origin = (ctx.req.headers.origin as string) ?? "https://yumhomestay.com";
          await sendHostApprovedEmail({
            to: hostUser.email,
            hostName: hostUser.name ?? "ホスト",
            dashboardUrl: `${origin}/host/dashboard`,
            calendarUrl: `${origin}/host/calendar`,
          });
        }
      } catch (emailErr) {
        console.error("[Host Approve] Failed to send approval email:", emailErr);
      }

      return { success: true };
    }),

  // Admin: reject host
  adminReject: adminProcedure
    .input(z.object({ hostId: z.number(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const host = await getHostById(input.hostId);
      if (!host) throw new TRPCError({ code: "NOT_FOUND" });

      await updateHost(input.hostId, {
        approvalStatus: "rejected",
        isActive: false,
      });

      await createAuditLog({
        userId: ctx.user.id,
        action: "host.reject",
        targetResource: "hosts",
        targetId: input.hostId.toString(),
        payload: JSON.stringify({ reason: input.reason }),
        ipAddress: ctx.req.ip,
      });

      // Send rejection email
      try {
        const hostUser = await getUserById(host.userId);
        if (hostUser?.email) {
          const { sendHostRejectedEmail } = await import("../email");
          const origin = (ctx.req.headers.origin as string) ?? "https://yumhomestay.com";
          await sendHostRejectedEmail({
            to: hostUser.email,
            hostName: hostUser.name ?? "ホスト",
            reason: input.reason,
            contactUrl: `${origin}/contact`,
          });
        }
      } catch (emailErr) {
        console.error("[Host Reject] Failed to send rejection email:", emailErr);
      }

      return { success: true };
    }),

  // Admin: set host to interview status
  adminSetInterview: adminProcedure
    .input(z.object({ hostId: z.number(), interviewScheduledAt: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const host = await getHostById(input.hostId);
      if (!host) throw new TRPCError({ code: "NOT_FOUND" });

      await updateHost(input.hostId, {
        approvalStatus: "interview",
        interviewScheduledAt: input.interviewScheduledAt ? new Date(input.interviewScheduledAt) : undefined,
      });

      return { success: true };
    }),

  // Admin: get approved hosts list (for inquiry matching)
  adminApprovedList: adminProcedure
    .query(async () => {
      const allHosts = await getAllHosts(200, 0);
      return allHosts
        .filter((h: (typeof allHosts)[0]) => h.approvalStatus === "approved" && h.isActive)
        .map((h: (typeof allHosts)[0]) => ({
          id: h.id,
          userId: h.userId,
          prefecture: h.prefecture,
          city: h.city,
          nearestStation: h.nearestStation,
          languages: h.languages,
          bioEn: h.bioEn,
          bioJa: h.bioJa,
          profileImageUrl: h.profileImageUrl,
          familyMemberCount: h.familyMemberCount,
          canCookTogether: h.canCookTogether,
          dietaryAccommodations: h.dietaryAccommodations,
        }));
    }),

  // Protected: update host profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        bioJa: z.string().optional(),
        bioEn: z.string().optional(),
        nearestStation: z.string().optional(),
        prefecture: z.string().optional(),
        city: z.string().optional(),
        languages: z.array(z.string()).optional(),
        profileImageUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const host = await getHostByUserId(ctx.user.id);
      if (!host) throw new TRPCError({ code: "NOT_FOUND" });

      const updateData: Record<string, unknown> = { ...input };
      if (input.languages) updateData.languages = JSON.stringify(input.languages);

      await updateHost(host.id, updateData as Parameters<typeof updateHost>[1]);
      return { success: true };
    }),
});
