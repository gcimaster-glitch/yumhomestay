/**
 * inquiry.ts — ゲスト申込フロー（担当者確認フロー）
 * フロー: submitted → reviewing → host_contacted → confirmed → payment_sent → payment_received → completed / rejected / cancelled
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { notifyOwner } from "../_core/notification";
import {
  createGuestInquiry,
  getGuestInquiryById,
  getGuestInquiriesByUserId,
  getAllGuestInquiries,
  updateGuestInquiry,
  getUserById,
  getHostById,
  getExperienceById,
} from "../db";
import {
  sendGuestInquiryReceivedEmail,
  sendGuestInquiryConfirmedEmail,
  sendGuestInquiryRejectedEmail,
  sendGuestPaymentLinkEmail,
  sendHostContactedEmail,
  sendVideoCallScheduledEmail,
} from "../email";

export const inquiryRouter = router({
  // ─── ゲスト: 申込送信 ────────────────────────────────────────────────────────
  submit: protectedProcedure
    .input(
      z.object({
        adultsCount: z.number().int().min(2, "2名以上でお申し込みください"),
        childrenCount: z.number().int().min(0).default(0),
        infantsCount: z.number().int().min(0).default(0),
        preferredHostId: z.number().int().optional(), // 希望ホストID
        preferredArea: z.string().optional(),
        preferredDateFrom: z.string().optional(),
        preferredDateTo: z.string().optional(),
        originCountry: z.string().optional(),
        languages: z.array(z.string()).optional(),
        dietaryRestrictions: z.string().optional(),
        specialRequests: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const inquiry = await createGuestInquiry({
        userId: ctx.user.id,
        adultsCount: input.adultsCount,
        childrenCount: input.childrenCount,
        infantsCount: input.infantsCount,
        preferredHostId: input.preferredHostId,
        preferredArea: input.preferredArea,
        preferredDateFrom: input.preferredDateFrom,
        preferredDateTo: input.preferredDateTo,
        originCountry: input.originCountry,
        languages: input.languages ? JSON.stringify(input.languages) : null,
        dietaryRestrictions: input.dietaryRestrictions,
        specialRequests: input.specialRequests,
        status: "submitted",
      });

      // 申込受付メール送信
      const guestEmail = ctx.user.email;
      const guestName = ctx.user.name ?? "ゲスト";
      const guestLang = (ctx.user as { preferredLanguage?: string }).preferredLanguage ?? "ja";
      if (guestEmail) {
        await sendGuestInquiryReceivedEmail({
          to: guestEmail,
          guestName,
          adultsCount: input.adultsCount,
          childrenCount: input.childrenCount,
          preferredArea: input.preferredArea,
          preferredDateFrom: input.preferredDateFrom,
          preferredDateTo: input.preferredDateTo,
          lang: guestLang,
        }).catch((e) => console.error("[Email] sendGuestInquiryReceivedEmail failed:", e));
      }

      // オーナー通知
      await notifyOwner({
        title: `📩 新しいゲスト申込 (${guestName}様 / 大人${input.adultsCount}名)`,
        content: `希望ホストID: ${input.preferredHostId ?? "未指定"}
エリア: ${input.preferredArea ?? "未指定"}\n日程: ${input.preferredDateFrom ?? ""}〜${input.preferredDateTo ?? ""}\n出身国: ${input.originCountry ?? "未指定"}\n食事制限: ${input.dietaryRestrictions ?? "なし"}\nご要望: ${input.specialRequests ?? "なし"}`,
      }).catch(() => {});

      return { success: true };
    }),

  // ─── ゲスト: 自分の申込一覧 ─────────────────────────────────────────────────
  myInquiries: protectedProcedure.query(async ({ ctx }) => {
    return getGuestInquiriesByUserId(ctx.user.id);
  }),

  // ─── ゲスト: 申込キャンセル ──────────────────────────────────────────────────
  cancel: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const inquiry = await getGuestInquiryById(input.id);
      if (!inquiry) throw new TRPCError({ code: "NOT_FOUND" });
      if (inquiry.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (["completed", "rejected", "cancelled"].includes(inquiry.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "この申込はキャンセルできません" });
      }
      await updateGuestInquiry(input.id, { status: "cancelled" });
      return { success: true };
    }),

  // ─── 管理者: 申込一覧 ────────────────────────────────────────────────────────
  adminList: adminProcedure
    .input(
      z.object({
        status: z.enum(["submitted", "reviewing", "host_contacted", "confirmed", "payment_sent", "payment_received", "completed", "rejected", "cancelled"]).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }).optional()
    )
    .query(async ({ input }) => {
      const { status, limit = 50, offset = 0 } = input ?? {};
      return getAllGuestInquiries(limit, offset, status);
    }),

  // ─── 管理者: 審査開始（reviewing）────────────────────────────────────────────
  adminStartReview: adminProcedure
    .input(z.object({ id: z.number(), staffName: z.string().optional(), staffNotes: z.string().optional() }))
    .mutation(async ({ input }) => {
      const inquiry = await getGuestInquiryById(input.id);
      if (!inquiry) throw new TRPCError({ code: "NOT_FOUND" });
      await updateGuestInquiry(input.id, {
        status: "reviewing",
        assignedStaffName: input.staffName,
        staffNotes: input.staffNotes,
        reviewedAt: new Date(),
      });
      return { success: true };
    }),

  // ─── 管理者: ホスト候補に連絡（host_contacted）───────────────────────────────
  adminContactHost: adminProcedure
    .input(
      z.object({
        id: z.number(),
        hostId: z.number(),
        experienceId: z.number().optional(),
        staffNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const inquiry = await getGuestInquiryById(input.id);
      if (!inquiry) throw new TRPCError({ code: "NOT_FOUND" });

      const host = await getHostById(input.hostId);
      if (!host) throw new TRPCError({ code: "NOT_FOUND", message: "ホストが見つかりません" });

      await updateGuestInquiry(input.id, {
        status: "host_contacted",
        assignedHostId: input.hostId,
        assignedExperienceId: input.experienceId,
        staffNotes: input.staffNotes,
        hostContactedAt: new Date(),
      });

      // ホストへ連絡メール送信
      const hostUser = host.userId ? await getUserById(host.userId) : null;
      if (hostUser?.email) {
        await sendHostContactedEmail({
          to: hostUser.email,
          hostName: hostUser.name ?? "ホスト",
          adultsCount: inquiry.adultsCount,
          childrenCount: inquiry.childrenCount ?? 0,
          preferredArea: inquiry.preferredArea ?? "",
          preferredDateFrom: inquiry.preferredDateFrom ?? "",
          preferredDateTo: inquiry.preferredDateTo ?? "",
          originCountry: inquiry.originCountry ?? "",
          dietaryRestrictions: inquiry.dietaryRestrictions ?? "",
        }).catch((e) => console.error("[Email] sendHostContactedEmail failed:", e));
      }

      return { success: true };
    }),

  // ─── 管理者: マッチング確定・ゲストへ決定通知（confirmed）──────────────────
  adminConfirm: adminProcedure
    .input(
      z.object({
        id: z.number(),
        hostId: z.number().optional(),
        experienceId: z.number().optional(),
        staffNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const inquiry = await getGuestInquiryById(input.id);
      if (!inquiry) throw new TRPCError({ code: "NOT_FOUND" });

      const updateData: Parameters<typeof updateGuestInquiry>[1] = {
        status: "confirmed",
        confirmedAt: new Date(),
        staffNotes: input.staffNotes,
      };
      if (input.hostId) updateData.assignedHostId = input.hostId;
      if (input.experienceId) updateData.assignedExperienceId = input.experienceId;

      await updateGuestInquiry(input.id, updateData);

      // ゲストへ確定通知メール
      const guest = await getUserById(inquiry.userId);
      if (guest?.email) {
        const host = input.hostId ? await getHostById(input.hostId) : null;
        const experience = input.experienceId ? await getExperienceById(input.experienceId) : null;
        await sendGuestInquiryConfirmedEmail({
          to: guest.email,
          guestName: guest.name ?? "ゲスト",
          hostBioEn: host?.bioEn ?? "",
          hostNearestStation: host?.nearestStation ?? "",
          experienceTitleJa: experience?.titleJa ?? "",
          experienceTitleEn: experience?.titleEn ?? "",
          lang: (guest as { preferredLanguage?: string }).preferredLanguage ?? "ja",
        }).catch((e) => console.error("[Email] sendGuestInquiryConfirmedEmail failed:", e));
      }

      return { success: true };
    }),

  // ─── 管理者: 請求リンク送信（payment_sent）───────────────────────────────────
  adminSendPaymentLink: adminProcedure
    .input(
      z.object({
        id: z.number(),
        paymentLinkUrl: z.string().url("有効なURLを入力してください"),
        staffNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const inquiry = await getGuestInquiryById(input.id);
      if (!inquiry) throw new TRPCError({ code: "NOT_FOUND" });

      await updateGuestInquiry(input.id, {
        status: "payment_sent",
        paymentLinkUrl: input.paymentLinkUrl,
        paymentLinkSentAt: new Date(),
        staffNotes: input.staffNotes,
      });

      // ゲストへ請求リンクメール送信
      const guest = await getUserById(inquiry.userId);
      if (guest?.email) {
        await sendGuestPaymentLinkEmail({
          to: guest.email,
          guestName: guest.name ?? "ゲスト",
          paymentLinkUrl: input.paymentLinkUrl,
          adultsCount: inquiry.adultsCount,
          childrenCount: inquiry.childrenCount ?? 0,
          lang: (guest as { preferredLanguage?: string }).preferredLanguage ?? "ja",
        }).catch((e) => console.error("[Email] sendGuestPaymentLinkEmail failed:", e));
      }

      return { success: true };
    }),

  // ─── 管理者: 入金確認（payment_received）────────────────────────────────────
  adminConfirmPayment: adminProcedure
    .input(z.object({ id: z.number(), staffNotes: z.string().optional() }))
    .mutation(async ({ input }) => {
      const inquiry = await getGuestInquiryById(input.id);
      if (!inquiry) throw new TRPCError({ code: "NOT_FOUND" });
      await updateGuestInquiry(input.id, {
        status: "payment_received",
        staffNotes: input.staffNotes,
      });
      return { success: true };
    }),

  // ─── 管理者: 申込却下（rejected）────────────────────────────────────────────
  adminReject: adminProcedure
    .input(z.object({ id: z.number(), rejectionReason: z.string().min(1, "却下理由を入力してください") }))
    .mutation(async ({ input }) => {
      const inquiry = await getGuestInquiryById(input.id);
      if (!inquiry) throw new TRPCError({ code: "NOT_FOUND" });

      await updateGuestInquiry(input.id, {
        status: "rejected",
        rejectionReason: input.rejectionReason,
      });

      // ゲストへ却下通知メール
      const guest = await getUserById(inquiry.userId);
      if (guest?.email) {
        await sendGuestInquiryRejectedEmail({
          to: guest.email,
          guestName: guest.name ?? "ゲスト",
          rejectionReason: input.rejectionReason,
        }).catch((e) => console.error("[Email] sendGuestInquiryRejectedEmail failed:", e));
      }

      return { success: true };
    }),

  // ─── 管理者: サービス完了（completed）───────────────────────────────────────
  adminComplete: adminProcedure
    .input(z.object({ id: z.number(), staffNotes: z.string().optional() }))
    .mutation(async ({ input }) => {
      const inquiry = await getGuestInquiryById(input.id);
      if (!inquiry) throw new TRPCError({ code: "NOT_FOUND" });
      await updateGuestInquiry(input.id, {
        status: "completed",
        completedAt: new Date(),
        staffNotes: input.staffNotes,
      });
      return { success: true };
    }),

  // ─── 管理者: ビデオ面談日時・リンク設定 ──────────────────────────────────────────────
  adminSetVideoCall: adminProcedure
    .input(
      z.object({
        id: z.number(),
        videoCallScheduledAt: z.string().optional(),
        videoCallMeetingUrl: z.string().optional(),
        videoCallNotes: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const inquiry = await getGuestInquiryById(input.id);
      if (!inquiry) throw new TRPCError({ code: "NOT_FOUND" });
      await updateGuestInquiry(input.id, {
        videoCallScheduledAt: input.videoCallScheduledAt ? new Date(input.videoCallScheduledAt) : null,
        videoCallMeetingUrl: input.videoCallMeetingUrl ?? null,
        videoCallNotes: input.videoCallNotes ?? null,
      });
      // ゲストに通知
      const guest = await getUserById(inquiry.userId);
      const scheduledStr = input.videoCallScheduledAt
        ? new Date(input.videoCallScheduledAt).toLocaleString("ja-JP", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })
        : "日時未定";
      await notifyOwner({
        title: `📹 ビデオ面談設定: 申込#${input.id}（${guest?.name ?? "ゲスト"}）`,
        content: `日時: ${scheduledStr}\nリンク: ${input.videoCallMeetingUrl ?? "未設定"}\nメモ: ${input.videoCallNotes ?? "なし"}`,
      }).catch(() => {});
      // ゲストにビデオ面談案内メールを送信
      if (guest?.email && input.videoCallScheduledAt) {
        await sendVideoCallScheduledEmail({
          to: guest.email,
          guestName: guest.name ?? "お客様",
          scheduledAt: new Date(input.videoCallScheduledAt),
          meetingUrl: input.videoCallMeetingUrl,
          notes: input.videoCallNotes,
          lang: (guest as { preferredLanguage?: string }).preferredLanguage ?? "ja",
        }).catch((err) => console.error("[Email] sendVideoCallScheduledEmail failed:", err));
      }
      return { success: true };
    }),

  // ─── 後方互換: ホストへの問い合わせ送信（旧API）──────────────────────────────
  send: protectedProcedure
    .input(
      z.object({
        experienceId: z.number().int().positive(),
        preferredDates: z.string().max(500),
        guestCount: z.number().int().min(1).max(20),
        message: z.string().min(10).max(2000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const senderName = ctx.user.name ?? "ゲスト";
      const senderEmail = ctx.user.email ?? "（メールアドレス未登録）";
      await notifyOwner({
        title: `📩 問い合わせ: 体験ID:${input.experienceId}（${senderName}様）`,
        content: `ゲスト: ${senderName} / ${senderEmail}\n人数: ${input.guestCount}名\n希望日程: ${input.preferredDates}\nメッセージ: ${input.message}`,
      });
      return { success: true };
    }),
});
