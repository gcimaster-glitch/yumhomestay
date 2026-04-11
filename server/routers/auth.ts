/**
 * 独自認証ルーター
 * - メール/パスワード登録・ログイン・パスワードリセット
 * - Google OAuth コールバック処理
 * - LINE Login コールバック処理
 * - 利用規約同意記録
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { eq, and, gt } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb, getUserByOpenId, upsertUser } from "../db";
import {
  users,
  passwordResetTokens,
  emailSignupTokens,
} from "../../drizzle/schema";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { sdk } from "../_core/sdk";
import {
  sendPasswordResetEmail,
  sendRegistrationVerificationEmail,
  sendWelcomeEmail,
} from "../email";

const TERMS_VERSION = "1.0";
const BCRYPT_ROUNDS = 12;

// ─── メール/パスワード登録（Step1: 確認メール送信）──────────────────────────────
const registerStep1 = publicProcedure
  .input(
    z.object({
      name: z.string().min(1).max(100),
      email: z.string().email().max(320),
      password: z.string().min(8).max(128),
      termsAgreed: z.boolean(),
    })
  )
  .mutation(async ({ input }) => {
    if (!input.termsAgreed) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "利用規約への同意が必要です" });
    }
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

    // 既存ユーザーチェック
    const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
    if (existing.length > 0) {
      throw new TRPCError({ code: "CONFLICT", message: "このメールアドレスは既に登録されています" });
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const token = crypto.randomBytes(48).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24時間

    // 既存の未使用トークンを削除
    await db.delete(emailSignupTokens).where(eq(emailSignupTokens.email, input.email));

    // 仮登録トークンを保存
    await db.insert(emailSignupTokens).values({
      email: input.email,
      name: input.name,
      passwordHash,
      token,
      expiresAt,
    });

    // 確認メール送信
    const verifyUrl = `https://www.yumhomestay.com/api/auth/verify-email?token=${token}`;
    await sendRegistrationVerificationEmail({
      to: input.email,
      name: input.name,
      verifyUrl,
    });

    return { success: true, message: "確認メールを送信しました。メールのリンクをクリックして登録を完了してください。" };
  });

// ─── メール/パスワードログイン ────────────────────────────────────────────────
const loginWithEmail = publicProcedure
  .input(
    z.object({
      email: z.string().email(),
      password: z.string().min(1),
      termsAgreed: z.boolean().optional(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

    const userRows = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
    if (userRows.length === 0) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "メールアドレスまたはパスワードが正しくありません" });
    }
    const user = userRows[0];

    if (!user.passwordHash) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "このアカウントはGoogleまたはLINEでログインしてください",
      });
    }

    if (!user.emailVerified) {
      throw new TRPCError({ code: "FORBIDDEN", message: "メールアドレスの確認が完了していません。確認メールをご確認ください。" });
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "メールアドレスまたはパスワードが正しくありません" });
    }

    // 利用規約同意（初回ログイン時）
    if (input.termsAgreed && !user.termsAgreedAt) {
      await db.update(users).set({
        termsAgreedAt: new Date(),
        termsVersion: TERMS_VERSION,
        lastSignedIn: new Date(),
      }).where(eq(users.id, user.id));
    } else {
      await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));
    }

    const sessionToken = await sdk.signSession(
      { openId: user.openId, appId: "yumhomestay", name: user.name ?? "" },
      { expiresInMs: ONE_YEAR_MS }
    );
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

    return { success: true };
  });

// ─── パスワードリセット要求 ───────────────────────────────────────────────────
const requestPasswordReset = publicProcedure
  .input(z.object({ email: z.string().email() }))
  .mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

    const userRows = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
    // セキュリティ上、ユーザーが存在しない場合も同じレスポンスを返す
    if (userRows.length === 0 || !userRows[0].passwordHash) {
      return { success: true, message: "パスワードリセットメールを送信しました（メールアドレスが登録されている場合）" };
    }
    const user = userRows[0];

    const token = crypto.randomBytes(48).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1時間

    // 既存トークンを削除
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
    });

    const resetUrl = `https://www.yumhomestay.com/reset-password?token=${token}`;
    await sendPasswordResetEmail({ to: input.email, name: user.name ?? "ユーザー", resetUrl });

    return { success: true, message: "パスワードリセットメールを送信しました" };
  });

// ─── パスワードリセット実行 ───────────────────────────────────────────────────
const resetPassword = publicProcedure
  .input(
    z.object({
      token: z.string().min(1),
      newPassword: z.string().min(8).max(128),
    })
  )
  .mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

    const tokenRows = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, input.token),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (tokenRows.length === 0 || tokenRows[0].usedAt) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "無効または期限切れのトークンです" });
    }

    const passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
    await db.update(users).set({ passwordHash }).where(eq(users.id, tokenRows[0].userId));
    await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, tokenRows[0].id));

    return { success: true, message: "パスワードを変更しました" };
  });

// ─── 利用規約同意記録 ─────────────────────────────────────────────────────────
const agreeToTerms = protectedProcedure
  .input(z.object({ version: z.string().default(TERMS_VERSION) }))
  .mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

    await db.update(users).set({
      termsAgreedAt: new Date(),
      termsVersion: input.version,
    }).where(eq(users.id, ctx.user.id));

    return { success: true };
  });

// ─── Google OAuthログイン開始URL取得 ─────────────────────────────────────────
const getGoogleAuthUrl = publicProcedure.query(() => {
  const { ENV } = require("../_core/env");
  if (!ENV.googleClientId) {
    return { url: null, available: false };
  }
  const params = new URLSearchParams({
    client_id: ENV.googleClientId,
    redirect_uri: `${ENV.appBaseUrl}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
  });
  return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params}`, available: true };
});

// ─── LINE LoginのURL取得 ──────────────────────────────────────────────────────
const getLineAuthUrl = publicProcedure.query(() => {
  const { ENV } = require("../_core/env");
  if (!ENV.lineClientId) {
    return { url: null, available: false };
  }
  const state = crypto.randomBytes(16).toString("hex");
  const params = new URLSearchParams({
    response_type: "code",
    client_id: ENV.lineClientId,
    redirect_uri: `${ENV.appBaseUrl}/api/auth/line/callback`,
    state,
    scope: "profile openid email",
  });
  return { url: `https://access.line.me/oauth2/v2.1/authorize?${params}`, available: true };
});

export const authRouter = router({
  registerStep1,
  loginWithEmail,
  requestPasswordReset,
  resetPassword,
  agreeToTerms,
  getGoogleAuthUrl,
  getLineAuthUrl,
});
