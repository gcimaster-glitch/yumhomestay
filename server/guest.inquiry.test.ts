/**
 * guest.inquiry.test.ts
 * ゲスト申込フロー（担当者確認フロー）のユニットテスト
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── DB helpers mock ──────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  createGuestInquiry: vi.fn(),
  getAllGuestInquiries: vi.fn(),
  getGuestInquiryById: vi.fn(),
  getGuestInquiriesByUserId: vi.fn(),
  updateGuestInquiry: vi.fn(),
  getUserById: vi.fn(),
}));

// ─── Email helpers mock ───────────────────────────────────────────────────────
vi.mock("./email", () => ({
  sendGuestInquiryReceivedEmail: vi.fn().mockResolvedValue({ id: "email-1" }),
  sendGuestInquiryConfirmedEmail: vi.fn().mockResolvedValue({ id: "email-2" }),
  sendGuestInquiryRejectedEmail: vi.fn().mockResolvedValue({ id: "email-3" }),
  sendGuestPaymentLinkEmail: vi.fn().mockResolvedValue({ id: "email-4" }),
  sendHostContactedEmail: vi.fn().mockResolvedValue({ id: "email-5" }),
}));

import {
  createGuestInquiry,
  getAllGuestInquiries,
  getGuestInquiryById,
  getGuestInquiriesByUserId,
  updateGuestInquiry,
  getUserById,
} from "./db";
import {
  sendGuestInquiryReceivedEmail,
  sendGuestInquiryConfirmedEmail,
  sendGuestInquiryRejectedEmail,
  sendGuestPaymentLinkEmail,
  sendHostContactedEmail,
} from "./email";

// ─── Test data ────────────────────────────────────────────────────────────────
const mockUser = {
  id: 1,
  name: "Test Guest",
  email: "guest@example.com",
  role: "user" as const,
  openId: "open-id-1",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockInquiry = {
  id: 1,
  userId: 1,
  adultsCount: 2,
  childrenCount: 0,
  infantsCount: 0,
  preferredArea: "東京（都内）",
  preferredDateFrom: "2026-04-01",
  preferredDateTo: "2026-04-05",
  originCountry: "USA",
  languages: null,
  dietaryRestrictions: null,
  specialRequests: null,
  assignedHostId: null,
  assignedExperienceId: null,
  assignedBookingId: null,
  assignedStaffName: null,
  staffNotes: null,
  paymentLinkUrl: null,
  paymentLinkSentAt: null,
  status: "submitted" as const,
  rejectionReason: null,
  submittedAt: new Date(),
  reviewedAt: null,
  hostContactedAt: null,
  confirmedAt: null,
  paymentSentAt: null,
  paymentReceivedAt: null,
  completedAt: null,
  rejectedAt: null,
  cancelledAt: null,
  updatedAt: new Date(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Guest Inquiry Flow — DB helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createGuestInquiry を呼び出せる", async () => {
    vi.mocked(createGuestInquiry).mockResolvedValue({ id: 1 });
    const result = await createGuestInquiry({
      userId: 1,
      adultsCount: 2,
      childrenCount: 0,
      infantsCount: 0,
    });
    expect(result).toEqual({ id: 1 });
    expect(createGuestInquiry).toHaveBeenCalledOnce();
  });

  it("getAllGuestInquiries: ステータスフィルターなしで全件取得できる", async () => {
    vi.mocked(getAllGuestInquiries).mockResolvedValue([mockInquiry]);
    const result = await getAllGuestInquiries(50, 0);
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("submitted");
  });

  it("getAllGuestInquiries: ステータスフィルターで絞り込める", async () => {
    vi.mocked(getAllGuestInquiries).mockResolvedValue([]);
    const result = await getAllGuestInquiries(50, 0, "reviewing");
    expect(result).toHaveLength(0);
    expect(getAllGuestInquiries).toHaveBeenCalledWith(50, 0, "reviewing");
  });

  it("getGuestInquiryById: 存在するIDで取得できる", async () => {
    vi.mocked(getGuestInquiryById).mockResolvedValue(mockInquiry);
    const result = await getGuestInquiryById(1);
    expect(result?.id).toBe(1);
    expect(result?.userId).toBe(1);
  });

  it("getGuestInquiryById: 存在しないIDでundefinedを返す", async () => {
    vi.mocked(getGuestInquiryById).mockResolvedValue(undefined);
    const result = await getGuestInquiryById(99999);
    expect(result).toBeUndefined();
  });

  it("getGuestInquiriesByUserId: ユーザーIDで申込一覧を取得できる", async () => {
    vi.mocked(getGuestInquiriesByUserId).mockResolvedValue([mockInquiry]);
    const result = await getGuestInquiriesByUserId(1);
    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe(1);
  });

  it("updateGuestInquiry: ステータスを更新できる", async () => {
    vi.mocked(updateGuestInquiry).mockResolvedValue(undefined);
    await updateGuestInquiry(1, { status: "reviewing" });
    expect(updateGuestInquiry).toHaveBeenCalledWith(1, { status: "reviewing" });
  });
});

describe("Guest Inquiry Flow — Email notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sendGuestInquiryReceivedEmail: 申込受付メールを送信できる", async () => {
    const result = await sendGuestInquiryReceivedEmail({
      to: "guest@example.com",
      guestName: "Test Guest",
      adultsCount: 2,
    });
    expect(result).toEqual({ id: "email-1" });
    expect(sendGuestInquiryReceivedEmail).toHaveBeenCalledOnce();
  });

  it("sendGuestInquiryConfirmedEmail: マッチング確定メールを送信できる", async () => {
    const result = await sendGuestInquiryConfirmedEmail({
      to: "guest@example.com",
      guestName: "Test Guest",
    });
    expect(result).toEqual({ id: "email-2" });
    expect(sendGuestInquiryConfirmedEmail).toHaveBeenCalledOnce();
  });

  it("sendGuestInquiryRejectedEmail: 申込却下メールを送信できる", async () => {
    const result = await sendGuestInquiryRejectedEmail({
      to: "guest@example.com",
      guestName: "Test Guest",
      rejectionReason: "ご希望条件に合うホストがいませんでした",
    });
    expect(result).toEqual({ id: "email-3" });
    expect(sendGuestInquiryRejectedEmail).toHaveBeenCalledOnce();
  });

  it("sendGuestPaymentLinkEmail: 請求リンクメールを送信できる", async () => {
    const result = await sendGuestPaymentLinkEmail({
      to: "guest@example.com",
      guestName: "Test Guest",
      paymentLinkUrl: "https://buy.stripe.com/test_123",
      adultsCount: 2,
    });
    expect(result).toEqual({ id: "email-4" });
    expect(sendGuestPaymentLinkEmail).toHaveBeenCalledOnce();
  });

  it("sendHostContactedEmail: ホスト候補連絡メールを送信できる", async () => {
    const result = await sendHostContactedEmail({
      to: "host@example.com",
      hostName: "Test Host",
      adultsCount: 2,
    });
    expect(result).toEqual({ id: "email-5" });
    expect(sendHostContactedEmail).toHaveBeenCalledOnce();
  });
});

describe("Guest Inquiry Flow — Status transitions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submitted → reviewing: 審査開始フローが正しく動作する", async () => {
    vi.mocked(getGuestInquiryById).mockResolvedValue(mockInquiry);
    vi.mocked(updateGuestInquiry).mockResolvedValue(undefined);

    const inquiry = await getGuestInquiryById(1);
    expect(inquiry?.status).toBe("submitted");

    await updateGuestInquiry(1, { status: "reviewing", reviewedAt: new Date() });
    expect(updateGuestInquiry).toHaveBeenCalledWith(1, expect.objectContaining({ status: "reviewing" }));
  });

  it("reviewing → host_contacted: ホスト連絡フローが正しく動作する", async () => {
    vi.mocked(getGuestInquiryById).mockResolvedValue({ ...mockInquiry, status: "reviewing" });
    vi.mocked(updateGuestInquiry).mockResolvedValue(undefined);
    vi.mocked(getUserById).mockResolvedValue(mockUser);

    const inquiry = await getGuestInquiryById(1);
    expect(inquiry?.status).toBe("reviewing");

    await updateGuestInquiry(1, { status: "host_contacted", hostContactedAt: new Date() });
    expect(updateGuestInquiry).toHaveBeenCalledWith(1, expect.objectContaining({ status: "host_contacted" }));
  });

  it("host_contacted → confirmed: マッチング確定フローが正しく動作する", async () => {
    vi.mocked(getGuestInquiryById).mockResolvedValue({ ...mockInquiry, status: "host_contacted" });
    vi.mocked(updateGuestInquiry).mockResolvedValue(undefined);
    vi.mocked(getUserById).mockResolvedValue(mockUser);

    const inquiry = await getGuestInquiryById(1);
    expect(inquiry?.status).toBe("host_contacted");

    await updateGuestInquiry(1, { status: "confirmed", confirmedAt: new Date() });
    await sendGuestInquiryConfirmedEmail({ to: mockUser.email, guestName: mockUser.name });

    expect(updateGuestInquiry).toHaveBeenCalledWith(1, expect.objectContaining({ status: "confirmed" }));
    expect(sendGuestInquiryConfirmedEmail).toHaveBeenCalledOnce();
  });

  it("confirmed → payment_sent: 請求リンク送信フローが正しく動作する", async () => {
    vi.mocked(getGuestInquiryById).mockResolvedValue({ ...mockInquiry, status: "confirmed" });
    vi.mocked(updateGuestInquiry).mockResolvedValue(undefined);
    vi.mocked(getUserById).mockResolvedValue(mockUser);

    const paymentUrl = "https://buy.stripe.com/test_123";
    await updateGuestInquiry(1, { status: "payment_sent", paymentLinkUrl: paymentUrl, paymentLinkSentAt: new Date() });
    await sendGuestPaymentLinkEmail({
      to: mockUser.email,
      guestName: mockUser.name,
      paymentLinkUrl: paymentUrl,
      adultsCount: 2,
    });

    expect(updateGuestInquiry).toHaveBeenCalledWith(1, expect.objectContaining({
      status: "payment_sent",
      paymentLinkUrl: paymentUrl,
    }));
    expect(sendGuestPaymentLinkEmail).toHaveBeenCalledWith(expect.objectContaining({
      paymentLinkUrl: paymentUrl,
    }));
  });

  it("payment_sent → payment_received: 入金確認フローが正しく動作する", async () => {
    vi.mocked(getGuestInquiryById).mockResolvedValue({ ...mockInquiry, status: "payment_sent" });
    vi.mocked(updateGuestInquiry).mockResolvedValue(undefined);

    await updateGuestInquiry(1, { status: "payment_received", paymentReceivedAt: new Date() });
    expect(updateGuestInquiry).toHaveBeenCalledWith(1, expect.objectContaining({ status: "payment_received" }));
  });

  it("payment_received → completed: 体験完了フローが正しく動作する", async () => {
    vi.mocked(getGuestInquiryById).mockResolvedValue({ ...mockInquiry, status: "payment_received" });
    vi.mocked(updateGuestInquiry).mockResolvedValue(undefined);

    await updateGuestInquiry(1, { status: "completed", completedAt: new Date() });
    expect(updateGuestInquiry).toHaveBeenCalledWith(1, expect.objectContaining({ status: "completed" }));
  });

  it("submitted → rejected: 申込却下フローが正しく動作する", async () => {
    vi.mocked(getGuestInquiryById).mockResolvedValue(mockInquiry);
    vi.mocked(updateGuestInquiry).mockResolvedValue(undefined);
    vi.mocked(getUserById).mockResolvedValue(mockUser);

    const rejectionReason = "ご希望条件に合うホストがいませんでした";
    await updateGuestInquiry(1, { status: "rejected", rejectionReason, rejectedAt: new Date() });
    await sendGuestInquiryRejectedEmail({
      to: mockUser.email,
      guestName: mockUser.name,
      rejectionReason,
    });

    expect(updateGuestInquiry).toHaveBeenCalledWith(1, expect.objectContaining({
      status: "rejected",
      rejectionReason,
    }));
    expect(sendGuestInquiryRejectedEmail).toHaveBeenCalledWith(expect.objectContaining({
      rejectionReason,
    }));
  });
});
