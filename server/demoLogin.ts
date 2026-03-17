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

// デモアカウントの定義
const DEMO_ACCOUNTS = [
  {
    key: "host",
    openId: "demo_host_001",
    name: "デモ ホストファミリー",
    email: "demo-host@yumhomestay.demo",
    redirectPath: "/host/dashboard",
    label: "ホストファミリー デモ",
  },
  {
    key: "cooking_school",
    openId: "demo_cooking_001",
    name: "デモ 料理教室",
    email: "demo-cooking@yumhomestay.demo",
    redirectPath: "/cooking-school/dashboard",
    label: "料理教室 デモ",
  },
  {
    key: "agent",
    openId: "demo_agent_001",
    name: "デモ 旅行代理店",
    email: "demo-agent@yumhomestay.demo",
    redirectPath: "/agent/dashboard",
    label: "旅行代理店 デモ",
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
