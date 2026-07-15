/**
 * Demo Login Routes
 * デモアカウント用の簡易ログインエンドポイント。
 * 本番環境では実際のメール送信・決済は動作しないモックとして機能する。
 */
import type { Express, Request, Response } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { sdk } from "./_core/sdk";
import { getSessionCookieOptions } from "./_core/cookies";
import * as db from "./db";
import { getDb } from "./db";
import { hosts, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// デモアカウントの定義
const DEMO_ACCOUNTS = [
  {
    key: "host",
    openId: "demo_host_001",
    name: "デモ ホストファミリー",
    email: "demo-host@yumhomestay.demo",
    redirectPath: "/host/dashboard",
    label: "ホストファミリー デモ",
    userType: "host" as const,
    setupHost: true,
  },
  {
    key: "cooking_school",
    openId: "demo_cooking_001",
    name: "デモ 料理教室",
    email: "demo-cooking@yumhomestay.demo",
    redirectPath: "/cooking-school/dashboard",
    label: "料理教室 デモ",
    userType: "host" as const,
    setupHost: false,
  },
  {
    key: "agent",
    openId: "demo_agent_001",
    name: "デモ 旅行代理店",
    email: "demo-agent@yumhomestay.demo",
    redirectPath: "/agent/dashboard",
    label: "旅行代理店 デモ",
    userType: "guest" as const,
    setupHost: false,
  },
] as const;

export function registerDemoLoginRoutes(app: Express) {
  // デモアカウント一覧API（フロントエンド用）
  app.get("/api/demo/accounts", (_req: Request, res: Response) => {
    res.json(
      DEMO_ACCOUNTS.map(({ key, label, redirectPath }) => ({
        key,
        label,
        redirectPath,
      }))
    );
  });

  // デモログインエンドポイント
  app.post("/api/demo/login", async (req: Request, res: Response) => {
    const { key } = req.body as { key?: string };
    const account = DEMO_ACCOUNTS.find((a) => a.key === key);

    if (!account) {
      res.status(400).json({ error: "Invalid demo account key" });
      return;
    }

    try {
      // DBにユーザーが存在することを確認（なければ作成）
      await db.upsertUser({
        openId: account.openId,
        name: account.name,
        email: account.email,
        loginMethod: "demo",
        lastSignedIn: new Date(),
      });

      // ホストデモの場合、hostsテーブルにもレコードを作成
      if (account.setupHost) {
        const dbConn = await getDb();
        if (dbConn) {
          // usersテーブルからユーザーIDを取得
          const userRows = await dbConn.select({ id: users.id })
            .from(users)
            .where(eq(users.openId, account.openId))
            .limit(1);
          const userId = userRows[0]?.id;

          if (userId) {
            // hostsテーブルにレコードが存在しなければ作成
            const existingHost = await dbConn.select({ id: hosts.id })
              .from(hosts)
              .where(eq(hosts.userId, userId))
              .limit(1);

            if (!existingHost[0]) {
              await dbConn.insert(hosts).values({
                userId,
                hostType: "individual",
                bioJa: "東京在住のホストファミリーです。日本の家庭料理を一緒に楽しみましょう！",
                bioEn: "We are a host family based in Tokyo. Let's enjoy Japanese home cooking together!",
                nearestStation: "品川駅",
                prefecture: "東京都",
                city: "港区",
                languages: JSON.stringify(["ja", "en"]),
                familyMemberCount: 4,
                canCookTogether: true,
                hasInsurance: true,
                registrationFeePaid: true,
                trainingCompleted: true,
                approvalStatus: "approved",
                isActive: true,
                approvedAt: new Date(),
                minSessionHours: 3,
                maxSessionHours: 5,
              });
            }
          }
        }
      }

      // セッショントークンを発行
      const sessionToken = await sdk.createSessionToken(account.openId, {
        name: account.name,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      res.json({ success: true, redirectPath: account.redirectPath });
    } catch (error) {
      console.error("[DemoLogin] Failed to create demo session:", error);
      res.status(500).json({ error: "Failed to create demo session" });
    }
  });
}
