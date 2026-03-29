/**
 * 独自認証 Express ルート
 * - GET  /api/auth/google/callback   - Google OAuthコールバック
 * - GET  /api/auth/line/callback     - LINE Loginコールバック
 * - GET  /api/auth/verify-email      - メールアドレス確認（新規登録）
 * - GET  /api/auth/google/url        - Google認証URL取得
 * - GET  /api/auth/line/url          - LINE認証URL取得
 */
import type { Express, Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { eq, and, gt } from "drizzle-orm";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";
import { getDb, upsertUser } from "../db";
import { users, emailSignupTokens } from "../../drizzle/schema";
import { sendWelcomeEmail } from "../email";

// ─── ユーティリティ ────────────────────────────────────────────────────────────

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function generateOpenId(provider: string, providerId: string): string {
  return crypto
    .createHash("sha256")
    .update(`${provider}:${providerId}`)
    .digest("hex")
    .substring(0, 64);
}

async function createSessionAndRedirect(
  req: Request,
  res: Response,
  openId: string,
  name: string,
  redirectPath: string = "/"
) {
  const sessionToken = await sdk.signSession(
    { openId, appId: "yumhomestay", name },
    { expiresInMs: ONE_YEAR_MS }
  );
  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
  res.redirect(302, redirectPath);
}

// ─── Google OAuth コールバック ─────────────────────────────────────────────────

async function handleGoogleCallback(req: Request, res: Response) {
  const code = getQueryParam(req, "code");
  const error = getQueryParam(req, "error");

  if (error || !code) {
    console.error("[Google OAuth] Error:", error);
    return res.redirect(302, "/login?error=google_auth_failed");
  }

  try {
    // アクセストークン取得
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: ENV.googleClientId,
        client_secret: ENV.googleClientSecret,
        redirect_uri: `${ENV.appBaseUrl}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("[Google OAuth] Token exchange failed:", err);
      return res.redirect(302, "/login?error=google_token_failed");
    }

    const tokenData = await tokenRes.json() as { access_token: string; id_token?: string };

    // ユーザー情報取得
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userInfoRes.ok) {
      return res.redirect(302, "/login?error=google_userinfo_failed");
    }

    const googleUser = await userInfoRes.json() as {
      sub: string;
      name?: string;
      email?: string;
      picture?: string;
    };

    const db = await getDb();
    if (!db) return res.redirect(302, "/login?error=db_unavailable");

    // 既存ユーザー確認（googleIdまたはemail）
    let user = (await db.select().from(users).where(eq(users.googleId, googleUser.sub)).limit(1))[0];

    if (!user && googleUser.email) {
      const byEmail = await db.select().from(users).where(eq(users.email, googleUser.email)).limit(1);
      if (byEmail.length > 0) {
        // 既存メールユーザーにgoogleIdを紐付け
        await db.update(users).set({
          googleId: googleUser.sub,
          avatarUrl: googleUser.picture ?? null,
          emailVerified: true,
          lastSignedIn: new Date(),
        }).where(eq(users.id, byEmail[0].id));
        user = byEmail[0];
      }
    }

    if (!user) {
      // 新規ユーザー作成
      const openId = generateOpenId("google", googleUser.sub);
      await upsertUser({
        openId,
        name: googleUser.name ?? null,
        email: googleUser.email ?? null,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });
      // 追加フィールドを更新
      const newUser = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
      if (newUser.length > 0) {
        await db.update(users).set({
          googleId: googleUser.sub,
          avatarUrl: googleUser.picture ?? null,
          emailVerified: true,
        }).where(eq(users.id, newUser[0].id));
        user = newUser[0];
        // ウェルカムメール送信
        if (googleUser.email) {
          sendWelcomeEmail({ to: googleUser.email, name: googleUser.name ?? "ユーザー" }).catch(console.error);
        }
      }
    } else {
      await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));
    }

    if (!user) return res.redirect(302, "/login?error=user_creation_failed");

    await createSessionAndRedirect(req, res, user.openId, user.name ?? "");
  } catch (err) {
    console.error("[Google OAuth] Callback error:", err);
    res.redirect(302, "/login?error=google_callback_error");
  }
}

// ─── LINE Login コールバック ──────────────────────────────────────────────────

async function handleLineCallback(req: Request, res: Response) {
  const code = getQueryParam(req, "code");
  const error = getQueryParam(req, "error");

  if (error || !code) {
    console.error("[LINE Login] Error:", error);
    return res.redirect(302, "/login?error=line_auth_failed");
  }

  try {
    // アクセストークン取得
    const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${ENV.appBaseUrl}/api/auth/line/callback`,
        client_id: ENV.lineClientId,
        client_secret: ENV.lineClientSecret,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("[LINE Login] Token exchange failed:", err);
      return res.redirect(302, "/login?error=line_token_failed");
    }

    const tokenData = await tokenRes.json() as { access_token: string; id_token?: string };

    // プロフィール取得
    const profileRes = await fetch("https://api.line.me/v2/profile", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!profileRes.ok) {
      return res.redirect(302, "/login?error=line_profile_failed");
    }

    const lineUser = await profileRes.json() as {
      userId: string;
      displayName?: string;
      pictureUrl?: string;
    };

    // メールアドレス取得（id_tokenから）
    let lineEmail: string | undefined;
    if (tokenData.id_token) {
      try {
        const parts = tokenData.id_token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
          lineEmail = payload.email;
        }
      } catch {}
    }

    const db = await getDb();
    if (!db) return res.redirect(302, "/login?error=db_unavailable");

    let user = (await db.select().from(users).where(eq(users.lineId, lineUser.userId)).limit(1))[0];

    if (!user && lineEmail) {
      const byEmail = await db.select().from(users).where(eq(users.email, lineEmail)).limit(1);
      if (byEmail.length > 0) {
        await db.update(users).set({
          lineId: lineUser.userId,
          avatarUrl: lineUser.pictureUrl ?? null,
          lastSignedIn: new Date(),
        }).where(eq(users.id, byEmail[0].id));
        user = byEmail[0];
      }
    }

    if (!user) {
      const openId = generateOpenId("line", lineUser.userId);
      await upsertUser({
        openId,
        name: lineUser.displayName ?? null,
        email: lineEmail ?? null,
        loginMethod: "line",
        lastSignedIn: new Date(),
      });
      const newUser = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
      if (newUser.length > 0) {
        await db.update(users).set({
          lineId: lineUser.userId,
          avatarUrl: lineUser.pictureUrl ?? null,
        }).where(eq(users.id, newUser[0].id));
        user = newUser[0];
        if (lineEmail) {
          sendWelcomeEmail({ to: lineEmail, name: lineUser.displayName ?? "ユーザー" }).catch(console.error);
        }
      }
    } else {
      await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));
    }

    if (!user) return res.redirect(302, "/login?error=user_creation_failed");

    await createSessionAndRedirect(req, res, user.openId, user.name ?? "");
  } catch (err) {
    console.error("[LINE Login] Callback error:", err);
    res.redirect(302, "/login?error=line_callback_error");
  }
}

// ─── メールアドレス確認（新規登録完了）──────────────────────────────────────────

async function handleEmailVerify(req: Request, res: Response) {
  const token = getQueryParam(req, "token");
  if (!token) return res.redirect(302, "/login?error=invalid_token");

  try {
    const db = await getDb();
    if (!db) return res.redirect(302, "/login?error=db_unavailable");

    const tokenRows = await db
      .select()
      .from(emailSignupTokens)
      .where(
        and(
          eq(emailSignupTokens.token, token),
          gt(emailSignupTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (tokenRows.length === 0 || tokenRows[0].usedAt) {
      return res.redirect(302, "/login?error=token_expired");
    }

    const signupData = tokenRows[0];

    // 既存ユーザーチェック（二重登録防止）
    const existing = await db.select().from(users).where(eq(users.email, signupData.email)).limit(1);
    if (existing.length > 0) {
      // 既に登録済み → そのままログイン
      await db.update(emailSignupTokens).set({ usedAt: new Date() }).where(eq(emailSignupTokens.id, signupData.id));
      await createSessionAndRedirect(req, res, existing[0].openId, existing[0].name ?? "");
      return;
    }

    // openIdを生成してユーザー作成
    const openId = generateOpenId("email", signupData.email);
    await upsertUser({
      openId,
      name: signupData.name,
      email: signupData.email,
      loginMethod: "email",
      lastSignedIn: new Date(),
    });

    // パスワードハッシュとemailVerifiedを設定
    const newUser = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
    if (newUser.length > 0) {
      await db.update(users).set({
        passwordHash: signupData.passwordHash,
        emailVerified: true,
      }).where(eq(users.id, newUser[0].id));
    }

    // トークンを使用済みにする
    await db.update(emailSignupTokens).set({ usedAt: new Date() }).where(eq(emailSignupTokens.id, signupData.id));

    // ウェルカムメール送信
    sendWelcomeEmail({ to: signupData.email, name: signupData.name }).catch(console.error);

    // セッション作成してリダイレクト
    await createSessionAndRedirect(req, res, openId, signupData.name, "/?welcome=1");
  } catch (err) {
    console.error("[Email Verify] Error:", err);
    res.redirect(302, "/login?error=verification_failed");
  }
}

// ─── ルート登録 ───────────────────────────────────────────────────────────────

export function registerAuthRoutes(app: Express) {
  // Google OAuth
  app.get("/api/auth/google/callback", handleGoogleCallback);
  app.get("/api/auth/google/url", (_req, res) => {
    if (!ENV.googleClientId) {
      return res.json({ available: false, url: null });
    }
    const params = new URLSearchParams({
      client_id: ENV.googleClientId,
      redirect_uri: `${ENV.appBaseUrl}/api/auth/google/callback`,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "select_account",
    });
    res.json({ available: true, url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
  });

  // LINE Login
  app.get("/api/auth/line/callback", handleLineCallback);
  app.get("/api/auth/line/url", (_req, res) => {
    if (!ENV.lineClientId) {
      return res.json({ available: false, url: null });
    }
    const state = crypto.randomBytes(16).toString("hex");
    const params = new URLSearchParams({
      response_type: "code",
      client_id: ENV.lineClientId,
      redirect_uri: `${ENV.appBaseUrl}/api/auth/line/callback`,
      state,
      scope: "profile openid email",
    });
    res.json({ available: true, url: `https://access.line.me/oauth2/v2.1/authorize?${params}` });
  });

  // メールアドレス確認
  app.get("/api/auth/verify-email", handleEmailVerify);

  console.log("[Auth] Custom auth routes registered: Google, LINE, Email verification");
}
