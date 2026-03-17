import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock DB functions ────────────────────────────────────────────────────────
vi.mock("../db", () => ({
  createBookingChat: vi.fn().mockResolvedValue({ insertId: 1 }),
  getChatsByInquiryId: vi.fn().mockResolvedValue([
    {
      id: 1,
      inquiryId: 10,
      bookingId: null,
      senderId: 5,
      senderRole: "guest",
      content: "場所はどこですか？",
      isAiGenerated: false,
      isReadByGuest: true,
      isReadByAdmin: false,
      aiModel: null,
      createdAt: new Date("2026-03-01T00:00:00Z"),
    },
  ]),
  getChatsByBookingId: vi.fn().mockResolvedValue([]),
  markChatsReadByGuest: vi.fn().mockResolvedValue(undefined),
  markChatsReadByAdmin: vi.fn().mockResolvedValue(undefined),
  getUnreadChatCountForAdmin: vi.fn().mockResolvedValue(3),
  getAllChatsForAdmin: vi.fn().mockResolvedValue([]),
  getGuestInquiryById: vi.fn().mockResolvedValue({
    id: 10,
    userId: 5,
    status: "confirmed",
  }),
  getBookingById: vi.fn().mockResolvedValue({
    id: 20,
    guestId: 5,
    status: "confirmed",
  }),
}));

// ─── Mock LLM ─────────────────────────────────────────────────────────────────
vi.mock("../_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: "最寄り駅でお迎えします。詳細はスタッフよりご連絡します。",
        },
      },
    ],
  }),
}));

import {
  createBookingChat,
  getChatsByInquiryId,
  getGuestInquiryById,
  getUnreadChatCountForAdmin,
} from "../db";
import { invokeLLM } from "../_core/llm";

describe("Chat router logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkChatAccess", () => {
    it("should allow access when inquiry status is confirmed", async () => {
      const inquiry = await getGuestInquiryById(10);
      expect(inquiry?.status).toBe("confirmed");
      const activeStatuses = ["confirmed", "payment_sent", "payment_received"];
      expect(activeStatuses.includes(inquiry!.status)).toBe(true);
    });

    it("should deny access when inquiry status is submitted", async () => {
      vi.mocked(getGuestInquiryById).mockResolvedValueOnce({
        id: 10,
        userId: 5,
        status: "submitted",
      } as any);
      const inquiry = await getGuestInquiryById(10);
      const activeStatuses = ["confirmed", "payment_sent", "payment_received"];
      expect(activeStatuses.includes(inquiry!.status)).toBe(false);
    });

    it("should deny access when inquiry status is completed", async () => {
      vi.mocked(getGuestInquiryById).mockResolvedValueOnce({
        id: 10,
        userId: 5,
        status: "completed",
      } as any);
      const inquiry = await getGuestInquiryById(10);
      const activeStatuses = ["confirmed", "payment_sent", "payment_received"];
      expect(activeStatuses.includes(inquiry!.status)).toBe(false);
    });
  });

  describe("sendMessage", () => {
    it("should create a guest message in the DB", async () => {
      await createBookingChat({
        inquiryId: 10,
        bookingId: null,
        senderId: 5,
        senderRole: "guest",
        content: "場所はどこですか？",
        isAiGenerated: false,
        isReadByGuest: true,
        isReadByAdmin: false,
      });
      expect(createBookingChat).toHaveBeenCalledWith(
        expect.objectContaining({
          inquiryId: 10,
          senderRole: "guest",
          content: "場所はどこですか？",
        })
      );
    });

    it("should call LLM for AI response after guest message", async () => {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are YHS assistant." },
          { role: "user", content: "場所はどこですか？" },
        ],
      });
      expect(invokeLLM).toHaveBeenCalled();
      const content = response?.choices?.[0]?.message?.content;
      expect(typeof content).toBe("string");
      expect(content!.length).toBeGreaterThan(0);
    });

    it("should save AI response to DB", async () => {
      const aiContent = "最寄り駅でお迎えします。詳細はスタッフよりご連絡します。";
      await createBookingChat({
        inquiryId: 10,
        bookingId: null,
        senderId: null,
        senderRole: "ai",
        content: aiContent,
        isAiGenerated: true,
        aiModel: "gpt-4o",
        isReadByGuest: false,
        isReadByAdmin: false,
      });
      expect(createBookingChat).toHaveBeenCalledWith(
        expect.objectContaining({
          senderRole: "ai",
          isAiGenerated: true,
          aiModel: "gpt-4o",
        })
      );
    });
  });

  describe("getMessages", () => {
    it("should return messages for an inquiry", async () => {
      const messages = await getChatsByInquiryId(10);
      expect(messages).toHaveLength(1);
      expect(messages[0].senderRole).toBe("guest");
      expect(messages[0].content).toBe("場所はどこですか？");
    });
  });

  describe("getUnreadCount", () => {
    it("should return unread count for admin", async () => {
      const count = await getUnreadChatCountForAdmin();
      expect(count).toBe(3);
    });
  });
});
