/**
 * 循環型エラー発見システム — サーバーサイドルーター
 *
 * 設計思想:
 * 1. フロントエンド・バックエンド双方のエラーをDBに記録
 * 2. 同一エラーが閾値（5回）を超えたらメール通知
 * 3. 管理者がステータスを管理（open→investigating→resolved）
 * 4. 定期的なエラーパターン分析（重複排除・重要度自動判定）
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  createErrorLog,
  getErrorLogs,
  updateErrorLogStatus,
  getErrorLogStats,
} from "../db";
import { sendAdminAlertEmail } from "../email";
import { getDb } from "../db";
import { errorLogs } from "../../drizzle/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";

// ─── 重複エラーの閾値 ──────────────────────────────────────────────────────────
const ALERT_THRESHOLD = 5; // 同一エラーが5回以上でアラートメール送信
const DEDUP_WINDOW_MS = 60 * 60 * 1000; // 1時間以内の同一エラーを重複とみなす

/**
 * エラーの重要度を自動判定する
 * - critical: 決済・認証・データ損失に関わるエラー
 * - high: 主要機能の動作不全
 * - medium: 一部機能の動作不全
 * - low: UI表示の軽微な問題
 */
function autoDetectSeverity(errorType: string, message: string): "low" | "medium" | "high" | "critical" {
  const msg = `${errorType} ${message}`.toLowerCase();
  if (msg.includes("payment") || msg.includes("stripe") || msg.includes("charge") ||
      msg.includes("auth") || msg.includes("token") || msg.includes("database") ||
      msg.includes("db") || msg.includes("data loss") || msg.includes("corruption")) {
    return "critical";
  }
  if (msg.includes("booking") || msg.includes("500") || msg.includes("internal server") ||
      msg.includes("crash") || msg.includes("fatal") || msg.includes("uncaught")) {
    return "high";
  }
  if (msg.includes("404") || msg.includes("not found") || msg.includes("timeout") ||
      msg.includes("network") || msg.includes("fetch")) {
    return "medium";
  }
  return "low";
}

/**
 * 修正提案を自動生成する（エラーパターンに基づく）
 */
function generateFixSuggestion(errorType: string, message: string, url?: string): string {
  const msg = `${errorType} ${message}`.toLowerCase();
  if (msg.includes("typeerror") && msg.includes("undefined")) {
    return "オプショナルチェーン（?.）またはnullチェックを追加してください。例: obj?.property";
  }
  if (msg.includes("network") || msg.includes("fetch") || msg.includes("failed to fetch")) {
    return "APIエンドポイントの疎通確認、CORSヘッダーの確認、サーバーの稼働状況を確認してください。";
  }
  if (msg.includes("chunk") || msg.includes("loading chunk")) {
    return "コード分割（lazy loading）のチャンクが読み込めていません。CDNキャッシュのクリアまたは再デプロイを試みてください。";
  }
  if (msg.includes("stripe") || msg.includes("payment")) {
    return "Stripe APIキーの有効性、Webhookの署名検証、決済フローのエラーハンドリングを確認してください。";
  }
  if (msg.includes("trpc") || msg.includes("bad_request") || msg.includes("not_found")) {
    return `tRPCエンドポイント（${url ?? "不明"}）のinputバリデーションとエラーハンドリングを確認してください。`;
  }
  if (msg.includes("auth") || msg.includes("unauthorized") || msg.includes("forbidden")) {
    return "認証トークンの有効期限、セッション管理、権限チェックロジックを確認してください。";
  }
  return "エラーのスタックトレースを確認し、発生箇所のコードをレビューしてください。";
}

export const errorMonitorRouter = router({
  /**
   * エラーを報告する（フロントエンド・バックエンドから呼び出し）
   * publicProcedure: 未ログインユーザーのエラーも収集するため
   */
  report: publicProcedure
    .input(z.object({
      errorType: z.string().max(200),
      message: z.string().max(5000),
      stack: z.string().max(10000).optional(),
      url: z.string().max(2048).optional(),
      userAgent: z.string().max(500).optional(),
      context: z.string().max(5000).optional(), // JSON文字列
      source: z.enum(["frontend", "backend", "api"]).default("frontend"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { success: false };

      const severity = autoDetectSeverity(input.errorType, input.message);
      const fixSuggestion = generateFixSuggestion(input.errorType, input.message, input.url);

      // 重複チェック: 同一エラータイプ+メッセージが1時間以内に存在するか
      const since = new Date(Date.now() - DEDUP_WINDOW_MS);
      const existing = await db
        .select()
        .from(errorLogs)
        .where(
          and(
            eq(errorLogs.errorType, input.errorType),
            eq(errorLogs.message, input.message),
            gte(errorLogs.createdAt, since),
          )
        )
        .limit(1);

      let errorId: number;
      let occurrenceCount = 1;

      if (existing.length > 0) {
        // 既存レコードの発生回数をインクリメント
        const newCount = (existing[0].occurrenceCount ?? 1) + 1;
        occurrenceCount = newCount;
        await db.update(errorLogs).set({
          occurrenceCount: newCount,
          updatedAt: new Date(),
          // ステータスがresolvedなら再openにする（再発検知）
          status: existing[0].status === "resolved" ? "open" : existing[0].status,
        }).where(eq(errorLogs.id, existing[0].id));
        errorId = existing[0].id;
      } else {
        // 新規エラーを記録
        const contextWithSuggestion = JSON.stringify({
          ...(input.context ? JSON.parse(input.context) : {}),
          fixSuggestion,
        });
        const result = await db.insert(errorLogs).values({
          errorType: input.errorType,
          message: input.message,
          stack: input.stack,
          url: input.url,
          userId: (ctx as { user?: { id: number } }).user?.id,
          userAgent: input.userAgent,
          ipAddress: (ctx as { req?: { ip?: string } }).req?.ip,
          context: contextWithSuggestion,
          severity,
          source: input.source,
          status: "open",
          occurrenceCount: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        errorId = (result as { insertId: number }).insertId;
      }

      // 閾値超過でアラートメール送信（critical/highのみ）
      if (occurrenceCount >= ALERT_THRESHOLD && (severity === "critical" || severity === "high")) {
        try {
          await sendAdminAlertEmail({
            subject: `[YumHomeStay] ${severity.toUpperCase()}エラー多発警告: ${input.errorType}`,
            body: `
エラーが${occurrenceCount}回発生しました。

【エラー種別】${input.errorType}
【重要度】${severity}
【メッセージ】${input.message}
【発生URL】${input.url ?? "不明"}
【発生源】${input.source}

【推奨対処法】
${fixSuggestion}

管理画面でご確認ください: https://www.yumhomestay.com/admin
            `.trim(),
          });
        } catch {
          // メール送信失敗はエラーとして扱わない（ループ防止）
        }
      }

      return { success: true, errorId, severity, fixSuggestion };
    }),

  /**
   * エラーログ一覧を取得する（管理者専用）
   */
  list: adminProcedure
    .input(z.object({
      status: z.enum(["open", "investigating", "resolved", "ignored"]).optional(),
      severity: z.enum(["low", "medium", "high", "critical"]).optional(),
      source: z.enum(["frontend", "backend", "api"]).optional(),
      limit: z.number().min(1).max(200).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      return getErrorLogs(input);
    }),

  /**
   * エラー統計を取得する（管理者専用）
   */
  stats: adminProcedure.query(async () => {
    return getErrorLogStats();
  }),

  /**
   * エラーのステータスを更新する（管理者専用）
   */
  updateStatus: adminProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["open", "investigating", "resolved", "ignored"]),
      resolvedNote: z.string().max(2000).optional(),
    }))
    .mutation(async ({ input }) => {
      await updateErrorLogStatus(input.id, input.status, input.resolvedNote);
      return { success: true };
    }),

  /**
   * エラーを解決済みにする（管理者専用）— resolveエイリアス
   */
  resolve: adminProcedure
    .input(z.object({
      id: z.number(),
      resolveNote: z.string().max(2000).optional(),
    }))
    .mutation(async ({ input }) => {
      await updateErrorLogStatus(input.id, "resolved", input.resolveNote);
      return { success: true };
    }),

  /**
   * エラーを無視する（管理者専用）— ignoreエイリアス
   */
  ignore: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await updateErrorLogStatus(input.id, "ignored");
      return { success: true };
    }),

  /**
   * エラーサマリーを取得する（管理者専用）— summaryエイリアス
   */
  summary: adminProcedure.query(async () => {
    const stats = await getErrorLogStats();
    return stats;
  }),

  /**
   * 自分自身のエラー報告履歴を取得する（ログインユーザー専用）
   */
  myErrors: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(errorLogs)
        .where(eq(errorLogs.userId, ctx.user.id))
        .limit(input.limit)
        .orderBy(desc(errorLogs.createdAt));
    }),
});
