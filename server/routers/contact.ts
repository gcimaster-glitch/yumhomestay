import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  createContactInquiry,
  getAllContactInquiries,
  updateContactInquiry,
} from "../db";
import { notifyOwner } from "../_core/notification";

export const contactRouter = router({
  // ── 公開：お問い合わせ送信 ──────────────────────────────────────────────────
  submit: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        email: z.string().email().max(320),
        inquiryType: z.string().min(1).max(50),
        message: z.string().min(10).max(2000),
      })
    )
    .mutation(async ({ input }) => {
      const id = await createContactInquiry({
        name: input.name,
        email: input.email,
        inquiryType: input.inquiryType,
        message: input.message,
      });
      // オーナーに通知
      await notifyOwner({
        title: `新しいお問い合わせ: ${input.inquiryType}`,
        content: `${input.name}（${input.email}）からお問い合わせが届きました。\n\n${input.message.slice(0, 200)}${input.message.length > 200 ? "..." : ""}`,
      }).catch(() => {/* 通知失敗は無視 */});
      return { success: true, id };
    }),

  // ── 管理者：一覧取得 ────────────────────────────────────────────────────────
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(["new", "in_progress", "resolved"]).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return getAllContactInquiries(input ?? undefined);
    }),

  // ── 管理者：ステータス・メモ更新 ────────────────────────────────────────────
  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        status: z.enum(["new", "in_progress", "resolved"]).optional(),
        adminNote: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { id, ...data } = input;
      await updateContactInquiry(id, data);
      return { success: true };
    }),
});
