/**
 * lead.ts — BtoB リード管理
 * ホストファミリー・料理教室・旅行代理店向けLPからの資料請求・デモ申込みリード
 */
import crypto from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { notifyOwner } from "../_core/notification";
import {
  createLead,
  getLeadById,
  getAllLeads,
  updateLead,
  deleteLead,
  getLeadByToken,
} from "../db";
import {
  sendLeadConfirmationEmail,
  sendLeadNotificationEmail,
  sendLeadReplyEmail,
} from "../email";

// ─── ヘルパー ─────────────────────────────────────────────────────────────────

function generateAccessToken(): string {
  return crypto.randomBytes(32).toString("hex"); // 64文字の16進数
}

function getBusinessPagePath(type: "host" | "cooking_school" | "agent"): string {
  const pathMap: Record<string, string> = {
    host: "/business/host",
    cooking_school: "/business/cooking-school",
    agent: "/business/agent",
  };
  return pathMap[type] ?? "/business/host";
}

// ─── 入力スキーマ ─────────────────────────────────────────────────────────────

const baseLeadSchema = z.object({
  name: z.string().min(1, "お名前を入力してください").max(100),
  company: z.string().max(200).optional(),
  email: z.string().email("正しいメールアドレスを入力してください"),
  phone: z
    .string()
    .min(10, "電話番号は10桁以上で入力してください")
    .max(20)
    .regex(/^[\d\-\+\(\)\s]+$/, "電話番号は数字・ハイフン・+のみ使用できます"),
  q1Answer: z.string().min(1, "Q1の回答を入力してください").max(500),
  q2Answer: z.string().min(1, "Q2の回答を入力してください").max(500),
  // フロントエンドのオリジン（ビジネスページURLの構築に使用）
  origin: z.string().url().optional(),
});

const hostLeadSchema = baseLeadSchema.extend({
  type: z.literal("host"),
  prefecture: z.string().min(1, "都道府県を選択してください").max(50),
  nearestStation: z.string().min(1, "最寄り駅を入力してください").max(100),
  maxGuests: z
    .number()
    .int()
    .min(2, "最大受入人数は2名以上で入力してください")
    .max(20),
});

const cookingSchoolLeadSchema = baseLeadSchema.extend({
  type: z.literal("cooking_school"),
  prefecture: z.string().min(1, "都道府県を選択してください").max(50),
  nearestStation: z.string().min(1, "最寄り駅を入力してください").max(100),
  maxGuests: z
    .number()
    .int()
    .min(2, "最大受入人数は2名以上で入力してください")
    .max(50),
});

const agentLeadSchema = baseLeadSchema.extend({
  type: z.literal("agent"),
  agentRegion: z.enum(["domestic", "international", "both"], {
    error: "取扱エリアを選択してください",
  }),
  agentCountry: z.string().max(100).optional(),
  agentState: z.string().max(100).optional(),
  specialtyRace: z.string().max(200).optional(),
});

const submitLeadSchema = z.discriminatedUnion("type", [
  hostLeadSchema,
  cookingSchoolLeadSchema,
  agentLeadSchema,
]);

// ─── ルーター ─────────────────────────────────────────────────────────────────

export const leadRouter = router({
  // ─── 公開: リード登録 ──────────────────────────────────────────────────────
  submit: publicProcedure.input(submitLeadSchema).mutation(async ({ input }) => {
    // アクセストークン生成
    const accessToken = generateAccessToken();

    // DB登録（accessToken含む）
    const leadId = await createLead({
      type: input.type,
      name: input.name,
      company: input.company ?? null,
      email: input.email,
      phone: input.phone,
      prefecture: "prefecture" in input ? input.prefecture : null,
      nearestStation: "nearestStation" in input ? input.nearestStation : null,
      maxGuests: "maxGuests" in input ? input.maxGuests : null,
      agentRegion: "agentRegion" in input ? input.agentRegion : null,
      agentCountry: "agentCountry" in input ? (input.agentCountry ?? null) : null,
      agentState: "agentState" in input ? (input.agentState ?? null) : null,
      specialtyRace: "specialtyRace" in input ? (input.specialtyRace ?? null) : null,
      q1Answer: input.q1Answer,
      q2Answer: input.q2Answer,
      status: "new",
      accessToken,
    });

    // ビジネスページURL構築
    const origin = input.origin ?? "https://yumhomestay.com";
    const businessPath = getBusinessPagePath(input.type);
    const accessTokenUrl = `${origin}${businessPath}?token=${accessToken}`;

    // 確認メール送信（accessTokenUrl付き）
    sendLeadConfirmationEmail({
      to: input.email,
      name: input.name,
      type: input.type,
      accessTokenUrl,
    }).catch((e) => console.error("[Lead] Confirmation email failed:", e));

    // オーナー通知メール
    const ownerEmail = process.env.OWNER_NAME ? `${process.env.OWNER_NAME}@yumhomestay.com` : undefined;
    if (ownerEmail) {
      sendLeadNotificationEmail({
        to: ownerEmail,
        lead: {
          name: input.name,
          company: input.company,
          email: input.email,
          phone: input.phone,
          type: input.type,
          prefecture: "prefecture" in input ? input.prefecture : undefined,
          nearestStation: "nearestStation" in input ? input.nearestStation : undefined,
          maxGuests: "maxGuests" in input ? input.maxGuests : undefined,
          agentRegion: "agentRegion" in input ? input.agentRegion : undefined,
          agentCountry: "agentCountry" in input ? input.agentCountry : undefined,
          q1Answer: input.q1Answer,
          q2Answer: input.q2Answer,
        },
      }).catch((e) => console.error("[Lead] Owner notification failed:", e));
    }

    // オーナー push 通知
    const typeLabel: Record<string, string> = {
      host: "ホストファミリー",
      cooking_school: "料理教室",
      agent: "旅行代理店",
    };
    await notifyOwner({
      title: `📩 新規リード: ${typeLabel[input.type]} / ${input.name}`,
      content: `${input.email} / ${input.phone}`,
    }).catch(() => {});

    return { success: true, leadId };
  }),

  // ─── 公開: トークン検証 ────────────────────────────────────────────────────
  // Businessページがトークンの有効性を確認するために使用
  verifyToken: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .query(async ({ input }) => {
      const lead = await getLeadByToken(input.token);
      if (!lead) {
        return { valid: false, type: null as null };
      }
      return {
        valid: true,
        type: lead.type,
        name: lead.name,
      };
    }),

  // ─── 管理者: リード一覧 ────────────────────────────────────────────────────
  adminList: adminProcedure
    .input(
      z.object({
        type: z.enum(["host", "cooking_school", "agent"]).optional(),
        status: z
          .enum(["new", "contacted", "qualified", "converted", "rejected"])
          .optional(),
      })
    )
    .query(async ({ input }) => {
      return getAllLeads(input);
    }),

  // ─── 管理者: ステータス・メモ更新 ─────────────────────────────────────────
  adminUpdate: adminProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        status: z
          .enum(["new", "contacted", "qualified", "converted", "rejected"])
          .optional(),
        notes: z.string().max(5000).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const lead = await getLeadById(input.id);
      if (!lead) throw new TRPCError({ code: "NOT_FOUND", message: "リードが見つかりません" });
      await updateLead(input.id, {
        ...(input.status !== undefined && { status: input.status }),
        ...(input.notes !== undefined && { notes: input.notes }),
      });
      return { success: true };
    }),

  // ─── 管理者: 返信メール送信 ────────────────────────────────────────────────
  adminReply: adminProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        message: z.string().min(1, "返信内容を入力してください").max(5000),
      })
    )
    .mutation(async ({ input }) => {
      const lead = await getLeadById(input.id);
      if (!lead) throw new TRPCError({ code: "NOT_FOUND", message: "リードが見つかりません" });

      const sent = await sendLeadReplyEmail({
        to: lead.email,
        name: lead.name,
        message: input.message,
      });

      if (sent) {
        await updateLead(input.id, {
          repliedAt: new Date(),
          status: lead.status === "new" ? "contacted" : lead.status,
        });
      }

      return { success: sent };
    }),

  // ─── 管理者: 削除 ──────────────────────────────────────────────────────────
  adminDelete: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const lead = await getLeadById(input.id);
      if (!lead) throw new TRPCError({ code: "NOT_FOUND", message: "リードが見つかりません" });
      await deleteLead(input.id);
      return { success: true };
    }),

  // ─── 管理者: CSV エクスポート ──────────────────────────────────────────────
  adminExportCsv: adminProcedure
    .input(
      z.object({
        type: z.enum(["host", "cooking_school", "agent"]).optional(),
        status: z
          .enum(["new", "contacted", "qualified", "converted", "rejected"])
          .optional(),
      })
    )
    .query(async ({ input }) => {
      const allLeads = await getAllLeads(input);
      const headers = [
        "ID", "種別", "氏名", "会社名", "メール", "電話",
        "都道府県", "最寄り駅", "最大受入人数",
        "代理店エリア", "取扱国", "州・地域", "得意人種",
        "Q1回答", "Q2回答",
        "ステータス", "メモ", "最終返信日時", "登録日時",
      ];
      const typeLabel: Record<string, string> = {
        host: "ホストファミリー",
        cooking_school: "料理教室",
        agent: "旅行代理店",
      };
      const statusLabel: Record<string, string> = {
        new: "新規",
        contacted: "連絡済み",
        qualified: "有望",
        converted: "成約",
        rejected: "不採用",
      };
      const rows = allLeads.map((l) => [
        l.id,
        typeLabel[l.type] ?? l.type,
        l.name,
        l.company ?? "",
        l.email,
        l.phone,
        l.prefecture ?? "",
        l.nearestStation ?? "",
        l.maxGuests ?? "",
        l.agentRegion ?? "",
        l.agentCountry ?? "",
        l.agentState ?? "",
        l.specialtyRace ?? "",
        l.q1Answer ?? "",
        l.q2Answer ?? "",
        statusLabel[l.status] ?? l.status,
        l.notes ?? "",
        l.repliedAt ? new Date(l.repliedAt).toLocaleString("ja-JP") : "",
        new Date(l.createdAt).toLocaleString("ja-JP"),
      ]);

      const escape = (v: string | number) => {
        const s = String(v);
        return s.includes(",") || s.includes('"') || s.includes("\n")
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      };

      const csv =
        "\uFEFF" + // BOM for Excel
        [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");

      return { csv };
    }),
});
