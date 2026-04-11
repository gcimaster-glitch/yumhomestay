import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  sendCookingSchoolApprovedEmail,
  sendCookingSchoolRejectedEmail,
  sendCookingSchoolSuspendedEmail,
} from "../email";
import {
  createAuditLog,
  getAllBookings,
  getAllCookingSchools,
  getAllExperiences,
  getAllHosts,
  getAllUsers,
  getAdminStats,
  getAuditLogs,
  getAvailabilityByHostId,
  getCookingSchoolById,
  getHostById,
  getHostByUserId,
  getUserById,
  updateCookingSchool,
  updateExperience,
  updateHost,
  updateUser,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

// Admin-only middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
  return next({ ctx });
});

export const adminRouter = router({
  // Dashboard stats
  getStats: adminProcedure.query(async () => {
    return getAdminStats();
  }),

  // User management
  listUsers: adminProcedure
    .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }).optional())
    .query(async ({ input }) => {
      const { limit = 50, offset = 0 } = input ?? {};
      return getAllUsers(limit, offset);
    }),

  updateUserRole: adminProcedure
    .input(z.object({ userId: z.number(), role: z.enum(["user", "admin"]), userType: z.enum(["guest", "host", "agent", "admin"]) }))
    .mutation(async ({ ctx, input }) => {
      await updateUser(input.userId, { role: input.role, userType: input.userType });
      await createAuditLog({
        userId: ctx.user.id,
        action: "admin.update_user_role",
        targetResource: "users",
        targetId: String(input.userId),
        payload: JSON.stringify({ role: input.role, userType: input.userType }),
        ipAddress: ctx.req.ip,
      });
      return { success: true };
    }),

  // Host management
  listHosts: adminProcedure
    .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }).optional())
    .query(async ({ input }) => {
      const { limit = 50, offset = 0 } = input ?? {};
      return getAllHosts(limit, offset);
    }),

  approveHost: adminProcedure
    .input(z.object({ hostId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const host = await getHostById(input.hostId);
      if (!host) throw new TRPCError({ code: "NOT_FOUND" });

      await updateHost(input.hostId, {
        approvalStatus: "approved",
        isActive: true,
        approvedAt: new Date(),
        approvedBy: ctx.user.id,
      });

      await createAuditLog({
        userId: ctx.user.id,
        action: "admin.approve_host",
        targetResource: "hosts",
        targetId: String(input.hostId),
        ipAddress: ctx.req.ip,
      });

      return { success: true };
    }),

  rejectHost: adminProcedure
    .input(z.object({ hostId: z.number(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      await updateHost(input.hostId, { approvalStatus: "rejected", isActive: false });
      await createAuditLog({
        userId: ctx.user.id,
        action: "admin.reject_host",
        targetResource: "hosts",
        targetId: String(input.hostId),
        payload: JSON.stringify({ reason: input.reason }),
        ipAddress: ctx.req.ip,
      });
      return { success: true };
    }),

  // Experience management
  listExperiences: adminProcedure
    .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }).optional())
    .query(async ({ input }) => {
      const { limit = 50, offset = 0 } = input ?? {};
      return getAllExperiences(limit, offset);
    }),

  approveExperience: adminProcedure
    .input(z.object({ experienceId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await updateExperience(input.experienceId, { approvalStatus: "approved", isActive: true });
      await createAuditLog({
        userId: ctx.user.id,
        action: "admin.approve_experience",
        targetResource: "experiences",
        targetId: String(input.experienceId),
        ipAddress: ctx.req.ip,
      });
      return { success: true };
    }),

  rejectExperience: adminProcedure
    .input(z.object({ experienceId: z.number(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      await updateExperience(input.experienceId, { approvalStatus: "rejected", isActive: false });
      await createAuditLog({
        userId: ctx.user.id,
        action: "admin.reject_experience",
        targetResource: "experiences",
        targetId: String(input.experienceId),
        payload: JSON.stringify({ reason: input.reason }),
        ipAddress: ctx.req.ip,
      });
      return { success: true };
    }),

  // Booking management
  listBookings: adminProcedure
    .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }).optional())
    .query(async ({ input }) => {
      const { limit = 50, offset = 0 } = input ?? {};
      return getAllBookings(limit, offset);
    }),

  // Audit logs
  getAuditLogs: adminProcedure
    .input(z.object({ limit: z.number().default(100), offset: z.number().default(0) }).optional())
    .query(async ({ input }) => {
      const { limit = 100, offset = 0 } = input ?? {};
      return getAuditLogs(limit, offset);
    }),

  // ─── Cooking School Review ──────────────────────────────────────────────────
  /** Admin: list all cooking schools with owner info */
  listCookingSchools: adminProcedure
    .input(
      z.object({
        status: z.enum(["pending", "interview", "approved", "rejected", "suspended", "all"]).default("all"),
      }).optional()
    )
    .query(async ({ input }) => {
      const all = await getAllCookingSchools(200, 0);
      const status = input?.status ?? "all";
      const filtered = status === "all" ? all : all.filter((s: (typeof all)[0]) => s.approvalStatus === status);
      // Attach owner user info
      const withOwner = await Promise.all(
        filtered.map(async (school: (typeof all)[0]) => {
          const owner = await getUserById(school.userId);
          return {
            ...school,
            ownerName: owner?.name ?? null,
            ownerEmail: owner?.email ?? null,
          };
        })
      );
      return withOwner;
    }),

  /** Admin: approve a cooking school */
  approveCookingSchool: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const school = await getCookingSchoolById(input.id);
      if (!school) throw new TRPCError({ code: "NOT_FOUND" });
      await updateCookingSchool(input.id, {
        approvalStatus: "approved",
        isActive: true,
        approvedAt: new Date(),
        approvedBy: ctx.user.id,
      });
      // Also update linked host record (matched by userId)
      const host = await getHostByUserId(school.userId);
      if (host) {
        await updateHost(host.id, { approvalStatus: "approved", isActive: true });
      }
      await createAuditLog({
        userId: ctx.user.id,
        action: "admin.approve_cooking_school",
        targetResource: "cookingSchools",
        targetId: String(input.id),
        ipAddress: ctx.req.ip,
      });
      // Send approval email to owner
      const owner = await getUserById(school.userId);
      if (owner?.email) {
        const origin = ctx.req.headers.origin as string | undefined;
        const baseUrl = origin ?? "https://yumhomestay.com";
        await sendCookingSchoolApprovedEmail({
          to: owner.email,
          ownerName: owner.name ?? "オーナー",
          schoolName: school.nameJa,
          dashboardUrl: `${baseUrl}/cooking-school/dashboard`,
        });
      }
      return { success: true };
    }),

  /** Admin: reject a cooking school */
  rejectCookingSchool: adminProcedure
    .input(z.object({ id: z.number(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const school = await getCookingSchoolById(input.id);
      if (!school) throw new TRPCError({ code: "NOT_FOUND" });
      await updateCookingSchool(input.id, {
        approvalStatus: "rejected",
        isActive: false,
      });
      const host = await getHostByUserId(school.userId);
      if (host) {
        await updateHost(host.id, { approvalStatus: "rejected", isActive: false });
      }
      await createAuditLog({
        userId: ctx.user.id,
        action: "admin.reject_cooking_school",
        targetResource: "cookingSchools",
        targetId: String(input.id),
        payload: JSON.stringify({ reason: input.reason }),
        ipAddress: ctx.req.ip,
      });
      // Send rejection email to owner
      const owner = await getUserById(school.userId);
      if (owner?.email) {
        const origin = ctx.req.headers.origin as string | undefined;
        const baseUrl = origin ?? "https://yumhomestay.com";
        await sendCookingSchoolRejectedEmail({
          to: owner.email,
          ownerName: owner.name ?? "オーナー",
          schoolName: school.nameJa,
          reason: input.reason,
          reapplyUrl: `${baseUrl}/cooking-school/register`,
        });
      }
      return { success: true };
    }),

  // Admin: list approved hosts for availability calendar
  listApprovedHosts: adminProcedure.query(async () => {
    const hosts = await getAllHosts(500, 0);
    return hosts
      .filter((h: (typeof hosts)[0]) => h.approvalStatus === "approved")
      .map((h: (typeof hosts)[0]) => ({
        id: h.id,
        userId: h.userId,
        prefecture: h.prefecture,
        city: h.city,
        nearestStation: h.nearestStation,
        bioEn: h.bioEn,
      }));
  }),

  // Admin: get host availability slots
  getHostAvailability: adminProcedure
    .input(
      z.object({
        hostId: z.number(),
        fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
    )
    .query(async ({ input }) => {
      return getAvailabilityByHostId(input.hostId, input.fromDate, input.toDate);
    }),

  /** Admin: suspend a cooking school */
  suspendCookingSchool: adminProcedure
    .input(z.object({ id: z.number(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const school = await getCookingSchoolById(input.id);
      if (!school) throw new TRPCError({ code: "NOT_FOUND" });
      await updateCookingSchool(input.id, {
        approvalStatus: "suspended",
        isActive: false,
      });
      const host = await getHostByUserId(school.userId);
      if (host) {
        await updateHost(host.id, { approvalStatus: "suspended", isActive: false });
      }
      await createAuditLog({
        userId: ctx.user.id,
        action: "admin.suspend_cooking_school",
        targetResource: "cookingSchools",
        targetId: String(input.id),
        payload: JSON.stringify({ reason: input.reason }),
        ipAddress: ctx.req.ip,
      });
      // Send suspension email to owner
      const owner = await getUserById(school.userId);
      if (owner?.email) {
        const origin = ctx.req.headers.origin as string | undefined;
        const baseUrl = origin ?? "https://yumhomestay.com";
        await sendCookingSchoolSuspendedEmail({
          to: owner.email,
          ownerName: owner.name ?? "オーナー",
          schoolName: school.nameJa,
          reason: input.reason,
          contactUrl: `${baseUrl}/contact`,
        });
      }
      return { success: true };
    }),
});
