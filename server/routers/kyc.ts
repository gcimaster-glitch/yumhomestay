import { TRPCError } from "@trpc/server";
import Stripe from "stripe";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createKycSubmission,
  getKycSubmissionsByUserId,
  getAllKycSubmissions,
  updateKycSubmission,
  updateUser,
} from "../db";
import { storagePut } from "../storage";
import { notifyOwner } from "../_core/notification";

// ── Stripe Identity クライアント ──────────────────────────────────────────────
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-02-25.clover" })
  : null;

// ── ユーティリティ ──────────────────────────────────────────────────────────
function randomSuffix() {
  return Math.random().toString(36).slice(2, 10);
}

export const kycRouter = router({
  // ── Stripe Identity: VerificationSession 作成 ────────────────────────────
  // フロントエンドが stripe.verifyIdentity(clientSecret) を呼ぶための
  // client_secret を返す。Stripe が本人確認フローを担当する。
  createVerificationSession: protectedProcedure
    .input(
      z.object({
        returnUrl: z.string().url(), // 確認完了後のリダイレクト先
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!stripe) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Stripe が設定されていません。Settings → Payment でキーを設定してください。",
        });
      }
      // VerificationSession 作成（type: 'document' でパスポート・運転免許証・IDカード対応）
      const session = await stripe.identity.verificationSessions.create({
        type: "document",
        options: {
          document: {
            allowed_types: ["passport", "driving_license", "id_card"],
            require_id_number: false,
            require_live_capture: true,
            require_matching_selfie: true,
          },
        },
        metadata: {
          user_id: String(ctx.user.id),
          user_email: ctx.user.email ?? "",
        },
        return_url: input.returnUrl,
      });

      // DB に pending レコードを作成（Webhook で更新）
      const submissionId = await createKycSubmission({
        userId: ctx.user.id,
        documentType: "stripe_identity",
        stripeVerificationSessionId: session.id,
        stripeVerificationStatus: session.status,
      });

      // identityStatus を pending に更新
      await updateUser(ctx.user.id, { identityStatus: "pending" });

      return {
        clientSecret: session.client_secret,
        sessionId: session.id,
        submissionId,
      };
    }),

  // ── ユーザー：手動書類提出（フォールバック）─────────────────────────────
  // Stripe Identity が使えない環境向けの手動アップロード
  submit: protectedProcedure
    .input(
      z.object({
        documentType: z.enum(["passport", "drivers_license", "residence_card"]),
        documentFrontBase64: z.string().min(1), // data:image/...;base64,...
        documentBackBase64: z.string().optional(),
        selfieBase64: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Base64 → Buffer変換
      const toBuffer = (dataUrl: string): { buffer: Buffer; mime: string } => {
        const [header, data] = dataUrl.split(",");
        const mime = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
        return { buffer: Buffer.from(data, "base64"), mime };
      };

      const frontData = toBuffer(input.documentFrontBase64);
      const frontKey = `kyc/${ctx.user.id}/front-${randomSuffix()}.jpg`;
      const { url: frontUrl } = await storagePut(frontKey, frontData.buffer, frontData.mime);

      let backUrl: string | undefined;
      if (input.documentBackBase64) {
        const backData = toBuffer(input.documentBackBase64);
        const backKey = `kyc/${ctx.user.id}/back-${randomSuffix()}.jpg`;
        const { url } = await storagePut(backKey, backData.buffer, backData.mime);
        backUrl = url;
      }

      let selfieUrl: string | undefined;
      if (input.selfieBase64) {
        const selfieData = toBuffer(input.selfieBase64);
        const selfieKey = `kyc/${ctx.user.id}/selfie-${randomSuffix()}.jpg`;
        const { url } = await storagePut(selfieKey, selfieData.buffer, selfieData.mime);
        selfieUrl = url;
      }

      const id = await createKycSubmission({
        userId: ctx.user.id,
        documentType: input.documentType,
        documentFrontUrl: frontUrl,
        documentBackUrl: backUrl ?? null,
        selfieUrl: selfieUrl ?? null,
      });

      // identityStatus を pending に更新
      await updateUser(ctx.user.id, { identityStatus: "pending" });

      // オーナーに通知
      await notifyOwner({
        title: "新しいeKYC申請（手動）",
        content: `ユーザーID ${ctx.user.id}（${ctx.user.name ?? ctx.user.email ?? "不明"}）が本人確認書類を提出しました。書類種別: ${input.documentType}`,
      }).catch(() => {/* 通知失敗は無視 */});

      return { success: true, id };
    }),

  // ── ユーザー：自分の申請状況確認 ─────────────────────────────────────────
  myStatus: protectedProcedure.query(async ({ ctx }) => {
    const submissions = await getKycSubmissionsByUserId(ctx.user.id);
    const latest = submissions[0] ?? null;
    return {
      identityStatus: ctx.user.identityStatus,
      latestSubmission: latest
        ? {
            id: latest.id,
            documentType: latest.documentType,
            status: latest.status,
            reviewNote: latest.reviewNote,
            submittedAt: latest.submittedAt,
            reviewedAt: latest.reviewedAt,
            stripeVerificationStatus: latest.stripeVerificationStatus,
          }
        : null,
    };
  }),

  // ── 管理者：申請一覧 ──────────────────────────────────────────────────────
  adminList: protectedProcedure
    .input(
      z.object({
        status: z.enum(["pending", "approved", "rejected"]).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return getAllKycSubmissions(input ?? undefined);
    }),

  // ── 管理者：審査（承認/却下）────────────────────────────────────────────
  review: protectedProcedure
    .input(
      z.object({
        submissionId: z.number().int().positive(),
        userId: z.number().int().positive(),
        decision: z.enum(["approved", "rejected"]),
        reviewNote: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await updateKycSubmission(input.submissionId, {
        status: input.decision,
        reviewedBy: ctx.user.id,
        reviewNote: input.reviewNote ?? null,
        reviewedAt: new Date(),
      });
      // ユーザーの identityStatus を更新
      await updateUser(input.userId, {
        identityStatus: input.decision === "approved" ? "verified" : "failed",
      });
      return { success: true };
    }),

  // ── 管理者：Stripe Identity セッション詳細取得 ───────────────────────────
  getStripeSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (!stripe) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe not configured" });
      }
      const session = await stripe.identity.verificationSessions.retrieve(input.sessionId, {
        expand: ["verified_outputs", "last_verification_report"],
      });
      return {
        id: session.id,
        status: session.status,
        type: session.type,
        created: session.created,
        lastError: session.last_error,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        verifiedOutputs: (session as any).verified_outputs ?? null,
      };
    }),
});
