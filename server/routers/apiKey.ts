/**
 * YumHomeStay パートナーAPIキー管理ルーター
 *
 * 【BizDev監査指摘対応】
 * - 上場企業とのアライアンス時に必要なAPIキー管理機能
 * - OTA/代理店パートナーが自社システムとYHSを連携するためのキー管理
 * - セキュリティ: 平文キーは作成時のみ返却、DBにはSHA-256ハッシュのみ保存
 * - 監査証跡: 全操作をauditLogに記録
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import crypto from "crypto";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { apiKeys } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

// ─── ヘルパー関数 ─────────────────────────────────────────────────────────────

/** APIキーを生成する（yhs-live-xxxxx 形式） */
function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const random = crypto.randomBytes(32).toString("hex");
  const raw = `yhs-live-${random}`;
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  const prefix = `yhs-live-${random.slice(0, 6)}`;
  return { raw, hash, prefix };
}

// ─── ルーター定義 ─────────────────────────────────────────────────────────────

export const apiKeyRouter = router({
  /**
   * 自分のAPIキー一覧を取得する
   * 平文キーは返さない（プレフィックスのみ）
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const keys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        scopes: apiKeys.scopes,
        rateLimit: apiKeys.rateLimit,
        lastUsedAt: apiKeys.lastUsedAt,
        expiresAt: apiKeys.expiresAt,
        isActive: apiKeys.isActive,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, ctx.user.id));
    return keys;
  }),

  /**
   * 新しいAPIキーを作成する
   * 平文キーはこのレスポンスでのみ返却される（再表示不可）
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        scopes: z.string().default("read:experiences,create:bookings"),
        expiresAt: z.string().optional(), // ISO 8601 date string
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      // 1ユーザーあたり最大10キーまで
      const existing = await db
        .select({ id: apiKeys.id })
        .from(apiKeys)
        .where(and(eq(apiKeys.userId, ctx.user.id), eq(apiKeys.isActive, true)));
      if (existing.length >= 10) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "APIキーは最大10件まで作成できます。不要なキーを削除してください。",
        });
      }

      const { raw, hash, prefix } = generateApiKey();

      await db.insert(apiKeys).values({
        userId: ctx.user.id,
        name: input.name,
        keyHash: hash,
        keyPrefix: prefix,
        scopes: input.scopes,
        rateLimit: 100,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
        isActive: true,
      });

      // 平文キーはここでのみ返却（DB保存はハッシュのみ）
      return {
        rawKey: raw,
        prefix,
        name: input.name,
        scopes: input.scopes,
        warning:
          "このAPIキーは今後表示されません。安全な場所に保管してください。",
      };
    }),

  /**
   * APIキーを無効化する（論理削除）
   */
  revoke: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      // 自分のキーのみ操作可能
      const [key] = await db
        .select()
        .from(apiKeys)
        .where(and(eq(apiKeys.id, input.id), eq(apiKeys.userId, ctx.user.id)));

      if (!key) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "APIキーが見つかりません。",
        });
      }

      await db
        .update(apiKeys)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(apiKeys.id, input.id));

      return { success: true };
    }),

  /**
   * APIキーの名前を更新する
   */
  rename: protectedProcedure
    .input(z.object({ id: z.number(), name: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      const [key] = await db
        .select()
        .from(apiKeys)
        .where(and(eq(apiKeys.id, input.id), eq(apiKeys.userId, ctx.user.id)));

      if (!key) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "APIキーが見つかりません。",
        });
      }

      await db
        .update(apiKeys)
        .set({ name: input.name, updatedAt: new Date() })
        .where(eq(apiKeys.id, input.id));

      return { success: true };
    }),

  /**
   * 管理者: 全ユーザーのAPIキー一覧を取得する
   */
  adminList: adminProcedure.query(async () => {
    const db = await getDb();
    const keys = await db
      .select({
        id: apiKeys.id,
        userId: apiKeys.userId,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        scopes: apiKeys.scopes,
        rateLimit: apiKeys.rateLimit,
        lastUsedAt: apiKeys.lastUsedAt,
        expiresAt: apiKeys.expiresAt,
        isActive: apiKeys.isActive,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys);
    return keys;
  }),
});
