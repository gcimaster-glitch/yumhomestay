import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createCookingSchool,
  createHost,
  getAllCookingSchools,
  getActiveCookingSchools,
  getAllExperiencesByCookingSchoolId,
  getCookingSchoolById,
  getCookingSchoolByUserId,
  getCookingSchoolRatingSummary,
  getCookingSchoolReviews,
  getExperiencesByCookingSchoolId,
  getBookingsByCookingSchoolId,
  getHostByUserId,
  updateCookingSchool,
  updateHost,
} from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

export const cookingSchoolRouter = router({
  // ─── Public ──────────────────────────────────────────────────────────────────

  /** List all approved & active cooking schools */
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
        prefecture: z.string().optional(),
        hasHalalKitchen: z.boolean().optional(),
        hasWheelchairAccess: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      const schools = await getActiveCookingSchools(input.limit, input.offset);
      return schools.filter((s: (typeof schools)[0]) => {
        if (input.prefecture && s.prefecture !== input.prefecture) return false;
        if (input.hasHalalKitchen && !s.hasHalalKitchen) return false;
        if (input.hasWheelchairAccess && !s.hasWheelchairAccess) return false;
        return true;
      });
    }),

  /** Get a single cooking school by ID */
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const school = await getCookingSchoolById(input.id);
      if (!school) throw new TRPCError({ code: "NOT_FOUND", message: "Cooking school not found" });
      return school;
    }),

  /** Get rating summary for a cooking school */
  getRatingSummary: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getCookingSchoolRatingSummary(input.id);
    }),

  /** Get published reviews for a cooking school */
  getReviews: publicProcedure
    .input(z.object({ id: z.number(), limit: z.number().min(1).max(50).default(20), offset: z.number().min(0).default(0) }))
    .query(async ({ input }) => {
      return getCookingSchoolReviews(input.id, input.limit, input.offset);
    }),

  /** Get experiences (menu items) for a specific cooking school */
  getExperiences: publicProcedure
    .input(z.object({ cookingSchoolId: z.number() }))
    .query(async ({ input }) => {
      return getExperiencesByCookingSchoolId(input.cookingSchoolId);
    }),

  // ─── Protected ───────────────────────────────────────────────────────────────

  /** Get the current user's cooking school profile */
  myProfile: protectedProcedure.query(async ({ ctx }) => {
    return getCookingSchoolByUserId(ctx.user.id);
  }),

  /** Register a new cooking school */
  register: protectedProcedure
    .input(
      z.object({
        nameJa: z.string().min(1).max(255),
        nameEn: z.string().max(255).optional(),
        descriptionJa: z.string().optional(),
        descriptionEn: z.string().optional(),
        websiteUrl: z.string().url().optional().or(z.literal("")),
        phoneNumber: z.string().max(30).optional(),
        contactEmail: z.string().email().optional(),
        prefecture: z.string().max(100).optional(),
        city: z.string().max(100).optional(),
        nearestStation: z.string().max(255).optional(),
        googleMapsUrl: z.string().url().optional().or(z.literal("")),
        maxCapacity: z.number().min(1).max(500).optional(),
        hasKitchenEquipment: z.boolean().optional(),
        hasWheelchairAccess: z.boolean().optional(),
        hasHalalKitchen: z.boolean().optional(),
        languages: z.array(z.string()).optional(),
        businessLicenseNumber: z.string().max(100).optional(),
        certifications: z.array(z.string()).optional(),
        profileImageUrl: z.string().url().optional().or(z.literal("")),
        galleryImageUrls: z.array(z.string().url()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if already registered
      const existing = await getCookingSchoolByUserId(ctx.user.id);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You already have a cooking school registered",
        });
      }

      const { languages, certifications, galleryImageUrls, ...rest } = input;

      await createCookingSchool({
        userId: ctx.user.id,
        ...rest,
        languages: languages ? JSON.stringify(languages) : null,
        certifications: certifications ? JSON.stringify(certifications) : null,
        galleryImageUrls: galleryImageUrls ? JSON.stringify(galleryImageUrls) : null,
        approvalStatus: "pending",
        isActive: false,
      });

      // Also create a host record linked to this cooking school
      const school = await getCookingSchoolByUserId(ctx.user.id);
      if (school) {
        const existingHost = await getHostByUserId(ctx.user.id);
        if (!existingHost) {
          await createHost({
            userId: ctx.user.id,
            hostType: "cooking_school",
            cookingSchoolId: school.id,
            approvalStatus: "pending",
            isActive: false,
          });
        }
      }

      return { success: true };
    }),

  /** Update cooking school profile */
  update: protectedProcedure
    .input(
      z.object({
        nameJa: z.string().min(1).max(255).optional(),
        nameEn: z.string().max(255).optional(),
        descriptionJa: z.string().optional(),
        descriptionEn: z.string().optional(),
        websiteUrl: z.string().url().optional().or(z.literal("")),
        phoneNumber: z.string().max(30).optional(),
        contactEmail: z.string().email().optional(),
        prefecture: z.string().max(100).optional(),
        city: z.string().max(100).optional(),
        nearestStation: z.string().max(255).optional(),
        googleMapsUrl: z.string().url().optional().or(z.literal("")),
        maxCapacity: z.number().min(1).max(500).optional(),
        hasKitchenEquipment: z.boolean().optional(),
        hasWheelchairAccess: z.boolean().optional(),
        hasHalalKitchen: z.boolean().optional(),
        languages: z.array(z.string()).optional(),
        businessLicenseNumber: z.string().max(100).optional(),
        certifications: z.array(z.string()).optional(),
        profileImageUrl: z.string().url().optional().or(z.literal("")),
        galleryImageUrls: z.array(z.string().url()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const school = await getCookingSchoolByUserId(ctx.user.id);
      if (!school) throw new TRPCError({ code: "NOT_FOUND", message: "Cooking school not found" });

      const { languages, certifications, galleryImageUrls, ...rest } = input;
      const updateData: Record<string, unknown> = { ...rest };
      if (languages !== undefined) updateData.languages = JSON.stringify(languages);
      if (certifications !== undefined) updateData.certifications = JSON.stringify(certifications);
      if (galleryImageUrls !== undefined) updateData.galleryImageUrls = JSON.stringify(galleryImageUrls);

      await updateCookingSchool(school.id, updateData as Parameters<typeof updateCookingSchool>[1]);
      return { success: true };
    }),

  /** Get all bookings for the current user's cooking school */
  myBookings: protectedProcedure.query(async ({ ctx }) => {
    const school = await getCookingSchoolByUserId(ctx.user.id);
    if (!school) return [];
    return getBookingsByCookingSchoolId(school.id);
  }),

  /** Get rating summary for the current user's cooking school */
  myRatingSummary: protectedProcedure.query(async ({ ctx }) => {
    const school = await getCookingSchoolByUserId(ctx.user.id);
    if (!school) return { avgRating: 0, count: 0 };
    return getCookingSchoolRatingSummary(school.id);
  }),

  /** Get all experiences (including pending/inactive) for the current user's cooking school */
  myAllExperiences: protectedProcedure.query(async ({ ctx }) => {
    const school = await getCookingSchoolByUserId(ctx.user.id);
    if (!school) return [];
    const rows = await getAllExperiencesByCookingSchoolId(school.id);
    // rows have shape { experiences: {...}, hosts: {...} } due to join
    return rows.map((r: (typeof rows)[0]) => (r as unknown as { experiences: typeof r }).experiences ?? r);
  }),

  // ─── Admin ───────────────────────────────────────────────────────────────────

  /** Admin: list all cooking schools */
  adminList: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    return getAllCookingSchools(100, 0);
  }),

  /** Admin: approve or reject a cooking school */
  adminReview: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        action: z.enum(["approve", "reject", "suspend"]),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });

      const school = await getCookingSchoolById(input.id);
      if (!school) throw new TRPCError({ code: "NOT_FOUND" });

      const statusMap = {
        approve: "approved" as const,
        reject: "rejected" as const,
        suspend: "suspended" as const,
      };

      await updateCookingSchool(input.id, {
        approvalStatus: statusMap[input.action],
        isActive: input.action === "approve",
        approvedAt: input.action === "approve" ? new Date() : undefined,
        approvedBy: ctx.user.id,
      });

      // Also update the linked host record
      const host = await getHostByUserId(school.userId);
      if (host) {
        await updateHost(host.id, {
          approvalStatus: statusMap[input.action],
          isActive: input.action === "approve",
        });
      }

      return { success: true };
    }),
});
