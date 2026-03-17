import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import { createAuditLog, getDb, getNotificationsByUserId, getUserById, markNotificationRead, updateUser } from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { and, eq, gt } from "drizzle-orm";
import { emailVerificationTokens, users } from "../../drizzle/schema";
import { sendEmailVerificationEmail } from "../email";
import crypto from "crypto";

export const userRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserById(ctx.user.id);
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });
    // Strip sensitive fields
    const { passportInfoEncrypted, emergencyContactEncrypted, mfaSecret, ...safe } = user;
    return safe;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100).optional(),
        preferredLanguage: z.string().max(10).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await updateUser(ctx.user.id, input);
      await createAuditLog({
        userId: ctx.user.id,
        action: "user.update_profile",
        targetResource: "users",
        targetId: String(ctx.user.id),
        ipAddress: ctx.req.ip,
      });
      // 更新後のユーザー情報を返す（フロントエンドのキャッシュ更新用）
      const updated = await getUserById(ctx.user.id);
      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
      const { passportInfoEncrypted, emergencyContactEncrypted, mfaSecret, ...safe } = updated;
      return { success: true, user: safe };
    }),

  // メールアドレス変更リクエスト：確認メールを送信してトークンを発行
  requestEmailChange: protectedProcedure
    .input(
      z.object({
        newEmail: z.string().email().max(320),
        origin: z.string().url(), // フロントエンドのオリジン（リダイレクトURL生成用）
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      // 重複チェック
      const existing = await db.select().from(users).where(eq(users.email, input.newEmail)).limit(1);
      if (existing.length > 0 && existing[0].id !== ctx.user.id) {
        throw new TRPCError({ code: "CONFLICT", message: "このメールアドレスは既に使用されています" });
      }

      // 現在のメールアドレスと同じ場合はエラー
      const currentUser = await getUserById(ctx.user.id);
      if (!currentUser) throw new TRPCError({ code: "NOT_FOUND" });
      if (currentUser.email === input.newEmail) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "現在と同じメールアドレスです" });
      }

      // 既存の未使用トークンを無効化（同一ユーザーの古いトークンを削除）
      await db.delete(emailVerificationTokens).where(
        and(
          eq(emailVerificationTokens.userId, ctx.user.id),
          // usedAt IS NULL（未使用のもの）
        )
      );

      // 新しいトークンを発行
      const token = crypto.randomBytes(48).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24時間後

      await db.insert(emailVerificationTokens).values({
        userId: ctx.user.id,
        newEmail: input.newEmail,
        token,
        expiresAt,
      });

      // 確認メールを送信
      const verifyUrl = `${input.origin}/verify-email?token=${token}`;
      const lang = currentUser.preferredLanguage ?? "ja";
      await sendEmailVerificationEmail({
        to: input.newEmail,
        newEmail: input.newEmail,
        verifyUrl,
        lang,
      });

      await createAuditLog({
        userId: ctx.user.id,
        action: "user.request_email_change",
        targetResource: "users",
        targetId: String(ctx.user.id),
        ipAddress: ctx.req.ip,
      });

      return { success: true };
    }),

  // メールアドレス変更確認：トークンを検証してメールアドレスを更新
  confirmEmailChange: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ ctx }) => {
      // tokenはURLパラメータから取得するため、inputから受け取る
      throw new TRPCError({ code: "NOT_IMPLEMENTED" });
    }),

  // メールアドレス変更確認（トークン検証）
  verifyEmailToken: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      // トークンを検索
      const tokenRows = await db
        .select()
        .from(emailVerificationTokens)
        .where(
          and(
            eq(emailVerificationTokens.token, input.token),
            gt(emailVerificationTokens.expiresAt, new Date()),
          )
        )
        .limit(1);

      if (tokenRows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "トークンが無効または期限切れです" });
      }

      const tokenRow = tokenRows[0];

      // 使用済みチェック
      if (tokenRow.usedAt !== null) {
        throw new TRPCError({ code: "CONFLICT", message: "このリンクは既に使用されています" });
      }

      // メールアドレスを更新
      await db.update(users).set({ email: tokenRow.newEmail }).where(eq(users.id, tokenRow.userId));

      // トークンを使用済みにマーク
      await db.update(emailVerificationTokens)
        .set({ usedAt: new Date() })
        .where(eq(emailVerificationTokens.id, tokenRow.id));

      return { success: true, newEmail: tokenRow.newEmail };
    }),

  updateUserType: protectedProcedure
    .input(z.object({ userType: z.enum(["guest", "host", "agent", "admin"]) }))
    .mutation(async ({ ctx, input }) => {
      await updateUser(ctx.user.id, { userType: input.userType });
      return { success: true };
    }),

  getNotifications: protectedProcedure.query(async ({ ctx }) => {
    return getNotificationsByUserId(ctx.user.id);
  }),

  markNotificationRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await markNotificationRead(input.id);
      return { success: true };
    }),
});
