import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import { createMessage, getBookingById, getHostByUserId, getMessagesByBookingId } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const messageRouter = router({
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

      return getMessagesByBookingId(input.bookingId);
    }),

  send: protectedProcedure
    .input(
      z.object({
        bookingId: z.number(),
        content: z.string().min(1).max(2000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const booking = await getBookingById(input.bookingId);
      if (!booking) throw new TRPCError({ code: "NOT_FOUND" });

      const host = await getHostByUserId(ctx.user.id);
      const isGuest = booking.guestId === ctx.user.id;
      const isHost = host && booking.hostId === host.id;

      if (!isGuest && !isHost) throw new TRPCError({ code: "FORBIDDEN" });

      const receiverId = isGuest ? (host?.userId ?? booking.hostId) : booking.guestId;

      await createMessage({
        bookingId: input.bookingId,
        senderId: ctx.user.id,
        receiverId,
        content: input.content,
      });

      return { success: true };
    }),
});
