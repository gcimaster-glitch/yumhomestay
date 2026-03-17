import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import {
  createBookingChat,
  getChatsByInquiryId,
  getChatsByBookingId,
  markChatsReadByGuest,
  markChatsReadByAdmin,
  markChatsReadByAdminForInquiry,
  markChatsReadByGuestForInquiry,
  getUnreadChatCountForAdmin,
  getUnreadChatCountForGuest,
  getUnreadChatCountForHost,
  getHostChatThreads,
  getAllChatsForAdmin,
  getGuestInquiryById,
  getBookingById,
  getUserById,
} from "../db";

// ─── YHS AI System Prompt (多言語対応) ────────────────────────────────────────────────
function buildSystemPrompt(lang: string): string {
  const isJa = lang === "ja";
  const isZh = lang === "zh" || lang === "zh-CN" || lang === "zh-TW";
  const isKo = lang === "ko";
  // 言語指示文
  let langInstruction: string;
  if (isJa) {
    langInstruction = "必ず日本語で回答してください。";
  } else if (isZh) {
    langInstruction = "请用中文回复。";
  } else if (isKo) {
    langInstruction = "한국어로 답변해 주세요.";
  } else {
    langInstruction = "Please respond in English.";
  }
  return `You are a support assistant for Yum Home Stay (YHS). ${langInstruction}

[About YHS]
- Yum Home Stay offers one-day homestay experiences (cooking & cultural) at Japanese homes
- Base price: ¥20,000 for 2 adults, 4 hours
- Additional: +¥20,000 per extra adult, +¥12,000 per child (5+), +¥5,000 per infant (under 5)

[FAQ Guidelines]
- Location/Access: "Our staff or host will contact you with details. Pickup at the nearest station is planned."
- What to bring: "Comfortable clothes, camera (optional). We provide aprons."
- Dietary restrictions: "We have shared your requirements from the application with the host. Please let us know if you have additional concerns."
- Cancellation: "Please contact our staff for cancellation policy details."
- Emergency: "For emergencies, please contact us via this chat or reach our staff directly."

[Important]
- Do NOT share personal information (address, phone number, etc.) in chat
- For payment questions, direct guests to contact staff
- For questions you cannot answer, say staff will follow up
- Always be warm, polite, and helpful`;
}
// ─── Helper: check if chat is allowed ────────────────────────────────────────
async function checkChatAccess(
  inquiryId?: number | null,
  bookingId?: number | null
): Promise<{ allowed: boolean; reason?: string }> {
  if (inquiryId) {
    const inquiry = await getGuestInquiryById(inquiryId);
    if (!inquiry) return { allowed: false, reason: "申込が見つかりません" };
    const activeStatuses = ["confirmed", "payment_sent", "payment_received"];
    if (!activeStatuses.includes(inquiry.status)) {
      return { allowed: false, reason: "チャットは申込確定後から体験完了まで利用できます" };
    }
    return { allowed: true };
  }
  if (bookingId) {
    const booking = await getBookingById(bookingId);
    if (!booking) return { allowed: false, reason: "予約が見つかりません" };
    const activeStatuses = ["confirmed", "pending_payment"];
    if (!activeStatuses.includes(booking.status)) {
      return { allowed: false, reason: "チャットは予約確定後から体験完了まで利用できます" };
    }
    return { allowed: true };
  }
  return { allowed: false, reason: "申込IDまたは予約IDが必要です" };
}

export const chatRouter = router({
  // ─── Get messages for a chat thread ────────────────────────────────────────
  getMessages: protectedProcedure
    .input(
      z.object({
        inquiryId: z.number().optional(),
        bookingId: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { inquiryId, bookingId } = input;
      if (!inquiryId && !bookingId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "inquiryId or bookingId required" });
      }

      // Verify access: guest can only see their own chats
      if (ctx.user.role !== "admin") {
        if (inquiryId) {
          const inquiry = await getGuestInquiryById(inquiryId);
          if (!inquiry || inquiry.userId !== ctx.user.id) {
            throw new TRPCError({ code: "FORBIDDEN" });
          }
        }
        if (bookingId) {
          const booking = await getBookingById(bookingId);
          if (!booking || booking.guestId !== ctx.user.id) {
            throw new TRPCError({ code: "FORBIDDEN" });
          }
        }
      }

      // Mark as read by guest (non-admin)
      if (ctx.user.role !== "admin") {
        await markChatsReadByGuest(inquiryId, bookingId);
      } else {
        await markChatsReadByAdmin(inquiryId, bookingId);
      }

      if (inquiryId) return getChatsByInquiryId(inquiryId);
      return getChatsByBookingId(bookingId!);
    }),

  // ─── Send a message (guest) ─────────────────────────────────────────────────
  sendMessage: protectedProcedure
    .input(
      z.object({
        inquiryId: z.number().optional(),
        bookingId: z.number().optional(),
        content: z.string().min(1).max(2000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { inquiryId, bookingId, content } = input;

      // Check chat is allowed
      const access = await checkChatAccess(inquiryId, bookingId);
      if (!access.allowed) {
        throw new TRPCError({ code: "FORBIDDEN", message: access.reason });
      }

      // Verify ownership (non-admin)
      if (ctx.user.role !== "admin") {
        if (inquiryId) {
          const inquiry = await getGuestInquiryById(inquiryId);
          if (!inquiry || inquiry.userId !== ctx.user.id) {
            throw new TRPCError({ code: "FORBIDDEN" });
          }
        }
        if (bookingId) {
          const booking = await getBookingById(bookingId);
          if (!booking || booking.guestId !== ctx.user.id) {
            throw new TRPCError({ code: "FORBIDDEN" });
          }
        }
      }

      const senderRole = ctx.user.role === "admin" ? "admin" : "guest";

      // Save guest message
      await createBookingChat({
        inquiryId: inquiryId ?? null,
        bookingId: bookingId ?? null,
        senderId: ctx.user.id,
        senderRole,
        content,
        isAiGenerated: false,
        isReadByGuest: true,
        isReadByAdmin: false,
      });

      // Generate AI response only for guest messages
      if (senderRole === "guest") {
        try {
          // Get guest's preferred language for multilingual AI response
          const guestUser = await getUserById(ctx.user.id);
          const guestLang = guestUser?.preferredLanguage ?? "en";
          const systemPrompt = buildSystemPrompt(guestLang);

          // Get recent conversation history for context
          const history = inquiryId
            ? await getChatsByInquiryId(inquiryId)
            : await getChatsByBookingId(bookingId!);

          // Build message history (last 10 messages)
          const recentHistory = history.slice(-10);
          const messages = recentHistory.map((msg) => ({
            role: (msg.senderRole === "ai" ? "assistant" : "user") as "user" | "assistant",
            content: msg.content,
          }));

          // Add current message
          messages.push({ role: "user", content });

          const aiResponse = await invokeLLM({
            messages: [
              { role: "system", content: systemPrompt },
              ...messages,
            ],
          });

          const rawContent = aiResponse?.choices?.[0]?.message?.content;
          const aiContent = typeof rawContent === "string" ? rawContent : null;
          if (aiContent) {
            await createBookingChat({
              inquiryId: inquiryId ?? null,
              bookingId: bookingId ?? null,
              senderId: null,
              senderRole: "ai",
              content: aiContent,
              isAiGenerated: true,
              aiModel: "gpt-4o",
              isReadByGuest: false,
              isReadByAdmin: false,
            });
          }
        } catch (err) {
          // AI failure is non-fatal; log and continue
          console.error("[Chat] AI response failed:", err);
        }
      }

      return { success: true };
    }),

  // ─── Admin: reply to a chat thread ─────────────────────────────────────────
  adminReply: protectedProcedure
    .input(
      z.object({
        inquiryId: z.number().optional(),
        bookingId: z.number().optional(),
        content: z.string().min(1).max(2000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "管理者のみ利用できます" });
      }

      const { inquiryId, bookingId, content } = input;

      await createBookingChat({
        inquiryId: inquiryId ?? null,
        bookingId: bookingId ?? null,
        senderId: ctx.user.id,
        senderRole: "admin",
        content,
        isAiGenerated: false,
        isReadByGuest: false,
        isReadByAdmin: true,
      });

      return { success: true };
    }),

  // ─── Admin: get all chat threads ────────────────────────────────────────────
  adminGetAllChats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return getAllChatsForAdmin(200);
  }),

  // ─── Unread count (管理者: 未読チャット件数 / ゲスト: 自分の未読件数) ────────────────────
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role === "admin") return getUnreadChatCountForAdmin();
    return getUnreadChatCountForGuest(ctx.user.id);
  }),

  // ─── Host: unread count ──────────────────────────────────────────────────────
  getUnreadCountForHost: protectedProcedure.query(async ({ ctx }) => {
    return getUnreadChatCountForHost(ctx.user.id);
  }),

  // ─── Host: get chat threads ──────────────────────────────────────────────────
  hostGetThreads: protectedProcedure.query(async ({ ctx }) => {
    return getHostChatThreads(ctx.user.id);
  }),

  // ─── Host: reply to a chat thread ───────────────────────────────────────────
  hostReply: protectedProcedure
    .input(
      z.object({
        inquiryId: z.number().optional(),
        bookingId: z.number().optional(),
        content: z.string().min(1).max(2000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { inquiryId, bookingId, content } = input;
      if (!inquiryId && !bookingId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "inquiryId or bookingId required" });
      }
      await createBookingChat({
        inquiryId: inquiryId ?? null,
        bookingId: bookingId ?? null,
        senderId: ctx.user.id,
        senderRole: "host",
        content,
        isAiGenerated: false,
        isReadByGuest: false,
        isReadByAdmin: true,
      });
      return { success: true };
    }),

  // ─── Mark as read ────────────────────────────────────────────────────────────
  markAsRead: protectedProcedure
    .input(
      z.object({
        inquiryId: z.number().optional(),
        bookingId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { inquiryId, bookingId } = input;
      if (inquiryId) {
        if (ctx.user.role === "admin" || ctx.user.role === "user") {
          // admin・hostは管理者側既読、guestはゲスト側既読
          if (ctx.user.role === "admin") {
            await markChatsReadByAdminForInquiry(inquiryId);
          } else {
            await markChatsReadByGuestForInquiry(inquiryId);
          }
        } else {
          await markChatsReadByGuestForInquiry(inquiryId);
        }
      } else if (bookingId) {
        await markChatsReadByAdmin(undefined, bookingId);
      }
      return { success: true };
    }),
});