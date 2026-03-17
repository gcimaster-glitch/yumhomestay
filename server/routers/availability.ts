import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createAvailabilitySlot,
  deleteAvailabilitySlot,
  getAvailabilityByCookingSchoolId,
  getAvailabilityByHostId,
  getAvailableSlotsByHostId,
  getAvailabilitySlotById,
  getCookingSchoolByUserId,
  getHostByUserId,
  updateAvailabilitySlot,
} from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

export const availabilityRouter = router({
  /** Public: Get available slots for a host in a date range */
  getHostSlots: publicProcedure
    .input(
      z.object({
        hostId: z.number(),
        fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
    )
    .query(async ({ input }) => {
      return getAvailableSlotsByHostId(input.hostId, input.fromDate, input.toDate);
    }),

  /** Public: Get all slots (including booked/blocked) for a cooking school */
  getCookingSchoolSlots: publicProcedure
    .input(
      z.object({
        cookingSchoolId: z.number(),
        fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      })
    )
    .query(async ({ input }) => {
      return getAvailabilityByCookingSchoolId(input.cookingSchoolId, input.fromDate, input.toDate);
    }),

  /** Protected: Get my availability slots (host dashboard) */
  getMySlots: protectedProcedure
    .input(
      z.object({
        fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const host = await getHostByUserId(ctx.user.id);
      const cookingSchool = await getCookingSchoolByUserId(ctx.user.id);
      if (!host && !cookingSchool) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Host or cooking school not found" });
      }
      if (host) {
        return getAvailabilityByHostId(host.id, input.fromDate, input.toDate);
      }
      return getAvailabilityByCookingSchoolId(cookingSchool!.id, input.fromDate, input.toDate);
    }),

  /** Protected: Add a new availability slot */
  addSlot: protectedProcedure
    .input(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        endTime: z.string().regex(/^\d{2}:\d{2}$/),
        maxGuests: z.number().min(1).max(20).default(6),
        note: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const host = await getHostByUserId(ctx.user.id);
      const cookingSchool = await getCookingSchoolByUserId(ctx.user.id);
      if (!host && !cookingSchool) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Host or cooking school not found" });
      }
      const slot = await createAvailabilitySlot({
        hostId: host?.id ?? null,
        cookingSchoolId: cookingSchool?.id ?? null,
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
        maxGuests: input.maxGuests,
        status: "available",
        note: input.note ?? null,
      });
      return { success: true, insertId: (slot as { insertId?: number }).insertId };
    }),

  /** Protected: Add multiple slots at once (bulk) */
  addBulkSlots: protectedProcedure
    .input(
      z.object({
        slots: z.array(
          z.object({
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            startTime: z.string().regex(/^\d{2}:\d{2}$/),
            endTime: z.string().regex(/^\d{2}:\d{2}$/),
            maxGuests: z.number().min(1).max(20).default(6),
            note: z.string().max(500).optional(),
          })
        ).min(1).max(60),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const host = await getHostByUserId(ctx.user.id);
      const cookingSchool = await getCookingSchoolByUserId(ctx.user.id);
      if (!host && !cookingSchool) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Host or cooking school not found" });
      }
      let created = 0;
      for (const s of input.slots) {
        await createAvailabilitySlot({
          hostId: host?.id ?? null,
          cookingSchoolId: cookingSchool?.id ?? null,
          date: s.date,
          startTime: s.startTime,
          endTime: s.endTime,
          maxGuests: s.maxGuests,
          status: "available",
          note: s.note ?? null,
        });
        created++;
      }
      return { success: true, created };
    }),

  /** Protected: Update a slot (e.g. block it) */
  updateSlot: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["available", "blocked"]).optional(),
        maxGuests: z.number().min(1).max(20).optional(),
        note: z.string().max(500).optional(),
        startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const slot = await getAvailabilitySlotById(input.id);
      if (!slot) throw new TRPCError({ code: "NOT_FOUND", message: "Slot not found" });

      // Verify ownership
      const host = await getHostByUserId(ctx.user.id);
      const cookingSchool = await getCookingSchoolByUserId(ctx.user.id);
      const isOwner =
        (host && slot.hostId === host.id) ||
        (cookingSchool && slot.cookingSchoolId === cookingSchool.id) ||
        ctx.user.role === "admin";
      if (!isOwner) throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });

      const { id: _id, ...updateData } = input;
      await updateAvailabilitySlot(input.id, updateData);
      return { success: true };
    }),

  /** Protected: Delete a slot */
  deleteSlot: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const slot = await getAvailabilitySlotById(input.id);
      if (!slot) throw new TRPCError({ code: "NOT_FOUND", message: "Slot not found" });

      // Verify ownership
      const host = await getHostByUserId(ctx.user.id);
      const cookingSchool = await getCookingSchoolByUserId(ctx.user.id);
      const isOwner =
        (host && slot.hostId === host.id) ||
        (cookingSchool && slot.cookingSchoolId === cookingSchool.id) ||
        ctx.user.role === "admin";
      if (!isOwner) throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });

      if (slot.status === "booked") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot delete a booked slot" });
      }

      await deleteAvailabilitySlot(input.id);
      return { success: true };
    }),
});
