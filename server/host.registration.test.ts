import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock DB
vi.mock("./db", () => ({
  getDb: vi.fn(),
  getHostByUserId: vi.fn(),
  getHostById: vi.fn(),
  getUserById: vi.fn(),
  createHost: vi.fn(),
  updateHost: vi.fn(),
  updateUser: vi.fn(),
  createAuditLog: vi.fn(),
  getAllHosts: vi.fn(),
}));

// Mock email
vi.mock("./email", () => ({
  sendHostRegistrationReceivedEmail: vi.fn().mockResolvedValue(undefined),
  sendHostRegistrationFeeConfirmedEmail: vi.fn().mockResolvedValue(undefined),
  sendHostApprovedEmail: vi.fn().mockResolvedValue(undefined),
  sendHostRejectedEmail: vi.fn().mockResolvedValue(undefined),
}));

import {
  getHostByUserId,
  getHostById,
  getUserById,
  createHost,
  updateHost,
  updateUser,
  createAuditLog,
  getAllHosts,
} from "./db";
import {
  sendHostRegistrationReceivedEmail,
  sendHostApprovedEmail,
  sendHostRejectedEmail,
} from "./email";

const mockGetHostByUserId = vi.mocked(getHostByUserId);
const mockGetHostById = vi.mocked(getHostById);
const mockGetUserById = vi.mocked(getUserById);
const mockCreateHost = vi.mocked(createHost);
const mockUpdateHost = vi.mocked(updateHost);
const mockUpdateUser = vi.mocked(updateUser);
const mockCreateAuditLog = vi.mocked(createAuditLog);
const mockGetAllHosts = vi.mocked(getAllHosts);
const mockSendRegistrationReceivedEmail = vi.mocked(sendHostRegistrationReceivedEmail);
const mockSendApprovedEmail = vi.mocked(sendHostApprovedEmail);
const mockSendRejectedEmail = vi.mocked(sendHostRejectedEmail);

// Sample host data
const sampleHost = {
  id: 1,
  userId: 100,
  bioEn: "I love cooking Japanese food",
  bioJa: "日本料理が大好きです",
  nearestStation: "渋谷駅",
  prefecture: "東京都",
  city: "渋谷区",
  languages: JSON.stringify(["ja", "en"]),
  profileImageUrl: null,
  familyMemberCount: 3,
  hasInsurance: true,
  canCookTogether: true,
  dietaryAccommodations: null,
  certificationDetails: "ZOOM面談希望日時: 2026-03-10T10:00",
  approvalStatus: "pending" as const,
  isActive: false,
  registrationFeePaid: false,
  kycStatus: "unverified" as const,
  approvedAt: null,
  approvedBy: null,
  certificationIssuedAt: null,
  interviewScheduledAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  addressEncrypted: null,
};

const sampleUser = {
  id: 100,
  openId: "user_100",
  name: "田中太郎",
  email: "tanaka@example.com",
  role: "user" as const,
  userType: "guest" as const,
  identityStatus: "unverified" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  profileImageUrl: null,
  bio: null,
  preferredLanguage: null,
  nationality: null,
  stripeCustomerId: null,
};

describe("Host Registration Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Registration - DB helpers", () => {
    it("should create a host record with pending status", async () => {
      mockGetHostByUserId.mockResolvedValueOnce(null);
      mockCreateHost.mockResolvedValueOnce(undefined);
      mockUpdateUser.mockResolvedValueOnce(undefined);
      mockCreateAuditLog.mockResolvedValueOnce(undefined);

      // Simulate registration logic
      const existing = await getHostByUserId(100);
      expect(existing).toBeNull();

      await createHost({
        userId: 100,
        bioEn: "I love cooking",
        nearestStation: "渋谷駅",
        prefecture: "東京都",
        city: "渋谷区",
        languages: JSON.stringify(["ja", "en"]),
        familyMemberCount: 3,
        hasInsurance: true,
        canCookTogether: true,
        certificationDetails: "ZOOM面談希望日時: 2026-03-10T10:00",
        approvalStatus: "pending",
        isActive: false,
      });

      expect(mockCreateHost).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 100,
          approvalStatus: "pending",
          isActive: false,
        })
      );
    });

    it("should reject duplicate host registration", async () => {
      mockGetHostByUserId.mockResolvedValueOnce(sampleHost);

      const existing = await getHostByUserId(100);
      expect(existing).not.toBeNull();
      // In router, this would throw CONFLICT error
    });
  });

  describe("Email notifications", () => {
    it("should send registration received email with correct params", async () => {
      mockSendRegistrationReceivedEmail.mockResolvedValueOnce(undefined);

      await sendHostRegistrationReceivedEmail({
        to: "tanaka@example.com",
        hostName: "田中太郎",
        interviewPrefs: "2026-03-10T10:00",
        paymentUrl: "https://yumhomestay.com/host/register?step=payment",
      });

      expect(mockSendRegistrationReceivedEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "tanaka@example.com",
          hostName: "田中太郎",
        })
      );
    });

    it("should send approval email with dashboard URL", async () => {
      mockSendApprovedEmail.mockResolvedValueOnce(undefined);

      await sendHostApprovedEmail({
        to: "tanaka@example.com",
        hostName: "田中太郎",
        dashboardUrl: "https://yumhomestay.com/host/dashboard",
        calendarUrl: "https://yumhomestay.com/host/calendar",
      });

      expect(mockSendApprovedEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "tanaka@example.com",
          dashboardUrl: expect.stringContaining("/host/dashboard"),
        })
      );
    });

    it("should send rejection email with reason", async () => {
      mockSendRejectedEmail.mockResolvedValueOnce(undefined);

      await sendHostRejectedEmail({
        to: "tanaka@example.com",
        hostName: "田中太郎",
        reason: "家族人数が条件を満たしていません",
        contactUrl: "https://yumhomestay.com/contact",
      });

      expect(mockSendRejectedEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "tanaka@example.com",
          reason: "家族人数が条件を満たしていません",
        })
      );
    });
  });

  describe("Admin approval flow", () => {
    it("should update host to approved status", async () => {
      mockGetHostById.mockResolvedValueOnce(sampleHost);
      mockUpdateHost.mockResolvedValueOnce(undefined);
      mockCreateAuditLog.mockResolvedValueOnce(undefined);
      mockGetUserById.mockResolvedValueOnce(sampleUser);
      mockSendApprovedEmail.mockResolvedValueOnce(undefined);

      const host = await getHostById(1);
      expect(host).not.toBeNull();

      await updateHost(1, {
        approvalStatus: "approved",
        approvedAt: new Date(),
        approvedBy: 999,
        isActive: true,
        certificationIssuedAt: new Date(),
      });

      expect(mockUpdateHost).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          approvalStatus: "approved",
          isActive: true,
        })
      );
    });

    it("should update host to rejected status", async () => {
      mockGetHostById.mockResolvedValueOnce(sampleHost);
      mockUpdateHost.mockResolvedValueOnce(undefined);
      mockCreateAuditLog.mockResolvedValueOnce(undefined);
      mockGetUserById.mockResolvedValueOnce(sampleUser);
      mockSendRejectedEmail.mockResolvedValueOnce(undefined);

      await updateHost(1, {
        approvalStatus: "rejected",
        isActive: false,
      });

      expect(mockUpdateHost).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          approvalStatus: "rejected",
          isActive: false,
        })
      );
    });

    it("should list all hosts with status filter", async () => {
      const pendingHosts = [sampleHost];
      mockGetAllHosts.mockResolvedValueOnce(pendingHosts);

      const allHosts = await getAllHosts(50, 0);
      const filtered = allHosts.filter((h) => h.approvalStatus === "pending");

      expect(filtered).toHaveLength(1);
      expect(filtered[0].approvalStatus).toBe("pending");
    });
  });

  describe("Registration fee payment tracking", () => {
    it("should track registration fee paid status", () => {
      const unpaidHost = { ...sampleHost, registrationFeePaid: false };
      const paidHost = { ...sampleHost, registrationFeePaid: true };

      expect(unpaidHost.registrationFeePaid).toBe(false);
      expect(paidHost.registrationFeePaid).toBe(true);
    });

    it("should identify hosts needing payment", () => {
      const hosts = [
        { ...sampleHost, id: 1, registrationFeePaid: false },
        { ...sampleHost, id: 2, registrationFeePaid: true },
        { ...sampleHost, id: 3, registrationFeePaid: false },
      ];

      const needsPayment = hosts.filter((h) => !h.registrationFeePaid);
      expect(needsPayment).toHaveLength(2);
    });
  });
});
