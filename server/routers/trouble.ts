import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import {
  createAuditLog,
  createTroubleReport,
  getAllTroubleReports,
  getBookingById,
  getHostByUserId,
  updateTroubleReport,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { notifyOwner } from "../_core/notification";

export const troubleRouter = router({
  // Guest or Host: submit a trouble report
  create: protectedProcedure
    .input(
      z.object({
        bookingId: z.number().optional(),
        reportedUserId: z.number().optional(),
        category: z.enum(["no_show", "safety", "fraud", "quality", "other"]),
        description: z.string().min(20, "詳細を20文字以上入力してください").max(2000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // If bookingId provided, verify the reporter is involved
      if (input.bookingId) {
        const booking = await getBookingById(input.bookingId);
        if (!booking) throw new TRPCError({ code: "NOT_FOUND", message: "予約が見つかりません" });

        const host = await getHostByUserId(ctx.user.id);
        const isGuest = booking.guestId === ctx.user.id;
        const isHost = host && booking.hostId === host.id;

        if (!isGuest && !isHost) {
          throw new TRPCError({ code: "FORBIDDEN", message: "この予約に関連するトラブル報告のみ可能です" });
        }
      }

      await createTroubleReport({
        bookingId: input.bookingId ?? null,
        reporterId: ctx.user.id,
        reportedUserId: input.reportedUserId ?? null,
        category: input.category,
        description: input.description,
        status: "open",
      });

      // Notify owner
      const categoryLabels: Record<string, string> = {
        no_show: "ノーショー",
        safety: "安全・安心",
        fraud: "詐欺・不正",
        quality: "品質問題",
        other: "その他",
      };
      await notifyOwner({
        title: `[トラブル報告] ${categoryLabels[input.category] ?? input.category}`,
        content: `ユーザーID ${ctx.user.id} から新しいトラブル報告が届きました。\n予約ID: ${input.bookingId ?? "なし"}\n内容: ${input.description.slice(0, 200)}`,
      });

      await createAuditLog({
        userId: ctx.user.id,
        action: "trouble.create",
        targetResource: "troubleReports",
        ipAddress: ctx.req.ip,
      });

      return { success: true };
    }),

  // Admin: list all trouble reports
  adminList: protectedProcedure
    .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return getAllTroubleReports(input.limit, input.offset);
    }),

  // Admin: update trouble report status
  adminUpdate: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["open", "investigating", "resolved", "closed"]),
        resolution: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      await updateTroubleReport(input.id, {
        status: input.status,
        resolution: input.resolution,
        resolvedBy: input.status === "resolved" || input.status === "closed" ? ctx.user.id : undefined,
        resolvedAt: input.status === "resolved" || input.status === "closed" ? new Date() : undefined,
      });
      return { success: true };
    }),
});
