/**
 * 循環型エラー発見システム — 強化版サーバーサイドルーター
 *
 * 設計思想:
 * 1. フロントエンド・バックエンド双方のエラーをDBに記録
 * 2. 30+パターンの自動分類エンジン（エラーカテゴリ自動判定）
 * 3. パターン検出: 急増・時間帯集中・循環（解決後再発）を自動検知
 * 4. AI修正提案（GPT-4.1-mini）による具体的な対処法の生成
 * 5. 重要度別・時系列グラフ用の統計データを提供
 * 6. 閾値超過・急増・循環エラーでメール＋Slack通知
 */

import { z } from "zod";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  getErrorLogs,
  updateErrorLogStatus,
  getErrorLogStats,
} from "../db";
import { sendAdminAlertEmail } from "../email";
import { getDb } from "../db";
import { errorLogs } from "../../drizzle/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import OpenAI from "openai";

// ─── 定数 ─────────────────────────────────────────────────────────────────────
const ALERT_THRESHOLD = 5;               // 同一エラーが5回以上でアラート
const DEDUP_WINDOW_MS = 60 * 60 * 1000; // 1時間以内の同一エラーを重複とみなす
const SURGE_WINDOW_MS = 10 * 60 * 1000; // 10分以内に3件以上 = 急増
const SURGE_COUNT = 3;                   // 急増判定の閾値
const RECURRENCE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24時間以内に再発 = 循環エラー

// ─── エラーカテゴリ定義（30+パターン） ─────────────────────────────────────────
export type ErrorCategory =
  | "payment"      // 決済・Stripe関連
  | "auth"         // 認証・セッション関連
  | "database"     // DB接続・クエリエラー
  | "network"      // ネットワーク・API通信
  | "rendering"    // React描画エラー
  | "routing"      // ルーティング・404
  | "validation"   // バリデーション・型エラー
  | "performance"  // タイムアウト・遅延
  | "security"     // セキュリティ関連
  | "booking"      // 予約フロー関連
  | "upload"       // ファイルアップロード
  | "email"        // メール送信
  | "external_api" // 外部API（Stripe以外）
  | "chunk_load"   // コード分割チャンク読み込み
  | "unknown";     // 未分類

/**
 * エラーカテゴリを自動判定する（30+パターン）
 */
function classifyError(errorType: string, message: string, url?: string): ErrorCategory {
  const combined = `${errorType} ${message} ${url ?? ""}`.toLowerCase();

  if (combined.match(/stripe|payment|checkout|charge|invoice|refund|webhook.*stripe|card|billing/)) return "payment";
  if (combined.match(/auth|unauthorized|forbidden|jwt|token|session|login|logout|oauth|password|credential/)) return "auth";
  if (combined.match(/database|db|mysql|tidb|sql|query|connection.*pool|drizzle|prisma|sequelize/)) return "database";
  if (combined.match(/network|fetch|xhr|cors|timeout|connection.*refused|econnrefused|failed to fetch|net::|socket/)) return "network";
  if (combined.match(/react|render|component|hook|useeffect|usestate|rerender|hydrat|suspense|errorboundary/)) return "rendering";
  if (combined.match(/404|not found|route|navigation|redirect|history|location/)) return "routing";
  if (combined.match(/typeerror|validation|invalid|schema|zod|parse|undefined is not|null is not|cannot read prop/)) return "validation";
  if (combined.match(/timeout|slow|performance|memory|heap|out of memory|maximum call stack/)) return "performance";
  if (combined.match(/csrf|xss|injection|security|malicious|suspicious|rate.?limit|too many request/)) return "security";
  if (combined.match(/booking|reservation|schedule|availability|host|guest|experience/)) return "booking";
  if (combined.match(/upload|file|image|s3|storage|multipart|blob|file.*size|mime/)) return "upload";
  if (combined.match(/email|mail|resend|sendgrid|smtp|bounce|delivery/)) return "email";
  if (combined.match(/api.*error|external|third.?party|webhook|integration/)) return "external_api";
  if (combined.match(/chunk|loading chunk|dynamic import|code.?split|lazy/)) return "chunk_load";
  return "unknown";
}

/**
 * エラーの重要度を自動判定する（強化版）
 */
function autoDetectSeverity(
  errorType: string,
  message: string,
  category: ErrorCategory
): "low" | "medium" | "high" | "critical" {
  const msg = `${errorType} ${message}`.toLowerCase();

  if (category === "payment" || category === "database" || category === "security") return "critical";
  if (category === "auth" || category === "booking") return "high";
  if (msg.match(/crash|fatal|data.?loss|corruption|unrecoverable/)) return "critical";
  if (msg.match(/500|internal server|uncaught|unhandled/)) return "high";
  if (msg.match(/404|not found|timeout|network|fetch|validation/)) return "medium";
  return "low";
}

/**
 * ルールベースの修正提案を生成する（30+パターン）
 */
function generateRuleBasedSuggestion(
  errorType: string,
  message: string,
  category: ErrorCategory,
  url?: string
): string {
  const msg = `${errorType} ${message}`.toLowerCase();

  switch (category) {
    case "payment":
      if (msg.includes("webhook")) return "Stripe Webhookの署名検証（STRIPE_WEBHOOK_SECRET）を確認してください。RailwayのURLがStripeダッシュボードに正しく登録されているか確認が必要です。";
      if (msg.includes("card")) return "カード情報の入力エラーです。Stripe.jsのバージョン確認と、フロントエンドのエラーハンドリング（card.error.message表示）を改善してください。";
      return "Stripe APIキーの有効性（本番/テストの混在がないか）、Webhookの疎通、決済フローのエラーハンドリングを確認してください。";
    case "auth":
      if (msg.includes("jwt") || msg.includes("token")) return "JWTトークンの有効期限切れまたは署名不一致です。JWT_SECRETが正しく設定されているか、トークンのリフレッシュロジックを確認してください。";
      if (msg.includes("session")) return "セッションが切れています。セッションストアの設定とCookieのSameSite/Secure属性を確認してください。";
      return "認証フローを確認してください。ログイン後のリダイレクト先、権限チェックのロジック、セッション管理の整合性を確認してください。";
    case "database":
      if (msg.includes("connection")) return "DB接続プールが枯渇している可能性があります。TiDB CloudのMax Connections設定と、接続の適切なクローズ処理を確認してください。";
      if (msg.includes("duplicate") || msg.includes("unique")) return "一意制約違反です。INSERT前にEXISTSチェックを追加するか、ON DUPLICATE KEY UPDATEを使用してください。";
      return "DBクエリのエラーです。SQLの構文、テーブル・カラム名の存在確認、マイグレーションの適用状況を確認してください。";
    case "network":
      if (msg.includes("cors")) return "CORSエラーです。サーバー側のAccess-Control-Allow-Originヘッダーに正しいオリジンが設定されているか確認してください。";
      if (msg.includes("timeout")) return "APIタイムアウトです。エンドポイントの応答時間を計測し、N+1クエリやDBインデックス不足がないか確認してください。";
      return "ネットワーク接続エラーです。APIエンドポイントのURL確認、サーバーの稼働状況、ファイアウォール設定を確認してください。";
    case "rendering":
      if (msg.includes("undefined") || msg.includes("null")) return "コンポーネントのpropsまたはstateがundefined/nullです。オプショナルチェーン（?.）とデフォルト値（?? []）を追加してください。";
      if (msg.includes("hook")) return "Reactフックのルール違反です。条件分岐内でのuseState/useEffectの使用、またはカスタムフックの呼び出し順序を確認してください。";
      return "Reactレンダリングエラーです。ErrorBoundaryでエラーをキャッチし、コンポーネントのライフサイクルとデータフローを確認してください。";
    case "validation":
      if (msg.includes("typeerror")) return `TypeErrorです。変数の型を確認してください。発生箇所（${url ?? "不明"}）でオプショナルチェーン（?.）またはnullチェックを追加してください。`;
      return "バリデーションエラーです。入力値のスキーマ定義（Zod）と、APIのinput/outputの型整合性を確認してください。";
    case "chunk_load":
      return "コード分割チャンクの読み込み失敗です。CDNキャッシュのクリア、または再デプロイを実施してください。ユーザーにはページのハードリロード（Ctrl+Shift+R）を案内してください。";
    case "booking":
      return "予約フローのエラーです。booking.createの入力バリデーション、空き日程の確認ロジック、Stripe決済との連携部分を確認してください。";
    default:
      return `エラーのスタックトレースを確認し、発生箇所（${url ?? "不明"}）のコードをレビューしてください。`;
  }
}

/**
 * AIによる修正提案を生成する（GPT-4.1-mini使用）
 */
async function generateAISuggestion(
  errorType: string,
  message: string,
  stack: string | undefined,
  url: string | undefined,
  category: ErrorCategory
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return "";

  try {
    const client = new OpenAI({ apiKey });
    const prompt = `あなたはWebアプリケーションのエラー分析専門家です。以下のエラーに対して、具体的な修正方法を日本語で200文字以内で提案してください。

エラーカテゴリ: ${category}
エラー種別: ${errorType}
エラーメッセージ: ${message}
発生URL: ${url ?? "不明"}
スタックトレース（先頭3行）: ${stack?.split("\n").slice(0, 3).join(" | ") ?? "なし"}

修正提案（200文字以内、具体的なコード例や設定変更を含めること）:`;

    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
      temperature: 0.3,
    });

    return response.choices[0]?.message?.content?.trim() ?? "";
  } catch {
    return "";
  }
}

/**
 * パターン検出: 急増・循環を検知する
 */
async function detectPatterns(
  db: Awaited<ReturnType<typeof getDb>>,
  errorType: string,
  message: string,
  severity: "low" | "medium" | "high" | "critical"
): Promise<{ isSurge: boolean; isRecurrence: boolean; surgeCount: number }> {
  if (!db) return { isSurge: false, isRecurrence: false, surgeCount: 0 };

  const now = new Date();
  const surgeWindowStart = new Date(now.getTime() - SURGE_WINDOW_MS);
  const recurrenceWindowStart = new Date(now.getTime() - RECURRENCE_WINDOW_MS);

  // 急増検知: 10分以内に同種エラーが3件以上
  const surgeRows = await db
    .select({ cnt: sql<number>`count(*)` })
    .from(errorLogs)
    .where(and(eq(errorLogs.errorType, errorType), gte(errorLogs.createdAt, surgeWindowStart)));
  const surgeCount = Number(surgeRows[0]?.cnt ?? 0);
  const isSurge = surgeCount >= SURGE_COUNT && (severity === "high" || severity === "critical");

  // 循環検知: 24時間以内に一度resolvedになったエラーが再発
  const recurrenceRows = await db
    .select({ id: errorLogs.id })
    .from(errorLogs)
    .where(
      and(
        eq(errorLogs.errorType, errorType),
        eq(errorLogs.message, message),
        eq(errorLogs.status, "resolved"),
        gte(errorLogs.resolvedAt, recurrenceWindowStart)
      )
    )
    .limit(1);
  const isRecurrence = recurrenceRows.length > 0;

  return { isSurge, isRecurrence, surgeCount };
}

/**
 * Slack Webhook通知を送信する（SLACK_WEBHOOK_URLが設定されている場合）
 */
async function sendSlackAlert(params: {
  severity: string;
  category: ErrorCategory;
  errorType: string;
  message: string;
  url?: string;
  occurrenceCount: number;
  isSurge: boolean;
  isRecurrence: boolean;
  fixSuggestion: string;
}): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const emoji = params.severity === "critical" ? "🚨" : params.severity === "high" ? "⚠️" : "ℹ️";
  const badge = params.isRecurrence ? "🔄 循環エラー" : params.isSurge ? "📈 急増" : "";

  const payload = {
    text: `${emoji} *YumHomeStay エラーアラート* ${badge}`,
    blocks: [
      { type: "header", text: { type: "plain_text", text: `${emoji} ${params.severity.toUpperCase()} エラー ${badge}` } },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*カテゴリ:*\n${params.category}` },
          { type: "mrkdwn", text: `*発生回数:*\n${params.occurrenceCount}回` },
          { type: "mrkdwn", text: `*エラー種別:*\n${params.errorType}` },
          { type: "mrkdwn", text: `*発生URL:*\n${params.url ?? "不明"}` },
        ]
      },
      { type: "section", text: { type: "mrkdwn", text: `*メッセージ:*\n${params.message.slice(0, 300)}` } },
      { type: "section", text: { type: "mrkdwn", text: `*推奨対処法:*\n${params.fixSuggestion.slice(0, 300)}` } },
      {
        type: "actions",
        elements: [{ type: "button", text: { type: "plain_text", text: "管理画面で確認" }, url: "https://www.yumhomestay.com/admin", style: "danger" }]
      }
    ]
  };

  try {
    await fetch(webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  } catch { /* Slack通知失敗は無視 */ }
}

// ─── ルーター定義 ──────────────────────────────────────────────────────────────
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
      context: z.string().max(5000).optional(),
      source: z.enum(["frontend", "backend", "api"]).default("frontend"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { success: false };

      // 自動分類・重要度判定
      const category = classifyError(input.errorType, input.message, input.url);
      const severity = autoDetectSeverity(input.errorType, input.message, category);
      const ruleBasedSuggestion = generateRuleBasedSuggestion(input.errorType, input.message, category, input.url);

      // 重複チェック: 同一エラータイプ+メッセージが1時間以内に存在するか
      const since = new Date(Date.now() - DEDUP_WINDOW_MS);
      const existing = await db
        .select()
        .from(errorLogs)
        .where(and(eq(errorLogs.errorType, input.errorType), eq(errorLogs.message, input.message), gte(errorLogs.createdAt, since)))
        .limit(1);

      let errorId: number;
      let occurrenceCount = 1;

      if (existing.length > 0) {
        const newCount = (existing[0].occurrenceCount ?? 1) + 1;
        occurrenceCount = newCount;
        await db.update(errorLogs).set({
          occurrenceCount: newCount,
          updatedAt: new Date(),
          status: existing[0].status === "resolved" ? "open" : existing[0].status,
        }).where(eq(errorLogs.id, existing[0].id));
        errorId = existing[0].id;
      } else {
        // AI修正提案を非同期で取得（タイムアウト3秒）
        let aiSuggestion = "";
        try {
          aiSuggestion = await Promise.race([
            generateAISuggestion(input.errorType, input.message, input.stack, input.url, category),
            new Promise<string>((resolve) => setTimeout(() => resolve(""), 3000))
          ]);
        } catch { /* AI失敗は無視 */ }

        const finalSuggestion = aiSuggestion || ruleBasedSuggestion;
        const contextData = {
          ...(input.context ? JSON.parse(input.context) : {}),
          category,
          fixSuggestion: finalSuggestion,
          aiEnhanced: !!aiSuggestion,
        };

        const result = await db.insert(errorLogs).values({
          errorType: input.errorType,
          message: input.message,
          stack: input.stack,
          url: input.url,
          userId: (ctx as { user?: { id: number } }).user?.id,
          userAgent: input.userAgent,
          ipAddress: (ctx as { req?: { ip?: string } }).req?.ip,
          context: JSON.stringify(contextData),
          severity,
          source: input.source,
          status: "open",
          occurrenceCount: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        errorId = (result as { insertId: number }).insertId;
      }

      // パターン検出（急増・循環）
      const { isSurge, isRecurrence, surgeCount } = await detectPatterns(db, input.errorType, input.message, severity);

      // アラート送信条件
      const shouldAlert =
        (occurrenceCount >= ALERT_THRESHOLD && (severity === "critical" || severity === "high")) ||
        isSurge ||
        isRecurrence;

      if (shouldAlert) {
        const alertType = isRecurrence ? "🔄 循環エラー再発" : isSurge ? "📈 急増検知" : "⚠️ 多発警告";
        const subject = `[YumHomeStay] ${alertType}: ${input.errorType} (${severity.toUpperCase()})`;
        const body = `
${alertType} が検出されました。

【エラーカテゴリ】${category}
【エラー種別】${input.errorType}
【重要度】${severity}
【発生回数】${occurrenceCount}回${isSurge ? ` (直近10分で${surgeCount}件)` : ""}
【メッセージ】${input.message.slice(0, 500)}
【発生URL】${input.url ?? "不明"}
【発生源】${input.source}
${isRecurrence ? "⚠️ このエラーは一度解決済みになりましたが、24時間以内に再発しました（循環エラー）。" : ""}

【推奨対処法】
${ruleBasedSuggestion}

管理画面でご確認ください: https://www.yumhomestay.com/admin
        `.trim();

        try { await sendAdminAlertEmail({ subject, body }); } catch { /* 無視 */ }
        await sendSlackAlert({ severity, category, errorType: input.errorType, message: input.message, url: input.url, occurrenceCount, isSurge, isRecurrence, fixSuggestion: ruleBasedSuggestion });
      }

      return { success: true, errorId, severity, category, fixSuggestion: ruleBasedSuggestion, isSurge, isRecurrence };
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
   * 時系列グラフ用データを取得する（管理者専用）
   * 直近N日間の1日ごとのエラー件数を重要度別に返す
   */
  timeSeries: adminProcedure
    .input(z.object({ days: z.number().min(1).max(30).default(7) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);
      const rows = await db
        .select({
          date: sql<string>`DATE(createdAt)`,
          severity: errorLogs.severity,
          cnt: sql<number>`count(*)`,
        })
        .from(errorLogs)
        .where(gte(errorLogs.createdAt, since))
        .groupBy(sql`DATE(createdAt)`, errorLogs.severity)
        .orderBy(sql`DATE(createdAt)`);

      // 日付×重要度のマトリクスに変換
      const dateMap: Record<string, { date: string; critical: number; high: number; medium: number; low: number }> = {};
      for (const row of rows) {
        if (!dateMap[row.date]) {
          dateMap[row.date] = { date: row.date, critical: 0, high: 0, medium: 0, low: 0 };
        }
        dateMap[row.date][row.severity as "critical" | "high" | "medium" | "low"] = Number(row.cnt);
      }
      return Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
    }),

  /**
   * エラー種別別の集計を取得する（管理者専用）
   */
  categoryStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const rows = await db
      .select({
        errorType: errorLogs.errorType,
        severity: errorLogs.severity,
        cnt: sql<number>`count(*)`,
        totalOccurrences: sql<number>`sum(occurrenceCount)`,
      })
      .from(errorLogs)
      .where(eq(errorLogs.status, "open"))
      .groupBy(errorLogs.errorType, errorLogs.severity)
      .orderBy(sql`sum(occurrenceCount) desc`)
      .limit(20);

    return rows.map(row => ({
      errorType: row.errorType,
      severity: row.severity,
      uniqueErrors: Number(row.cnt),
      totalOccurrences: Number(row.totalOccurrences),
    }));
  }),

  /**
   * 循環エラー（解決後に再発したエラー）を取得する（管理者専用）
   */
  recurrenceList: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    return db
      .select()
      .from(errorLogs)
      .where(and(eq(errorLogs.status, "open"), sql`resolvedAt IS NOT NULL`))
      .orderBy(desc(errorLogs.updatedAt))
      .limit(50);
  }),

  /**
   * 急増エラーを取得する（直近10分で3件以上の同種エラー）
   */
  surgeList: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const since = new Date(Date.now() - SURGE_WINDOW_MS);
    const rows = await db
      .select({
        errorType: errorLogs.errorType,
        severity: errorLogs.severity,
        cnt: sql<number>`count(*)`,
        latestMessage: sql<string>`MAX(message)`,
        latestUrl: sql<string>`MAX(url)`,
      })
      .from(errorLogs)
      .where(gte(errorLogs.createdAt, since))
      .groupBy(errorLogs.errorType, errorLogs.severity)
      .having(sql`count(*) >= ${SURGE_COUNT}`)
      .orderBy(sql`count(*) desc`);

    return rows.map(row => ({
      errorType: row.errorType,
      severity: row.severity,
      count: Number(row.cnt),
      latestMessage: row.latestMessage,
      latestUrl: row.latestUrl,
    }));
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
   * エラーを解決済みにする（管理者専用）
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
   * エラーを無視する（管理者専用）
   */
  ignore: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await updateErrorLogStatus(input.id, "ignored");
      return { success: true };
    }),

  /**
   * エラーサマリーを取得する（管理者専用）
   */
  summary: adminProcedure.query(async () => {
    return getErrorLogStats();
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
