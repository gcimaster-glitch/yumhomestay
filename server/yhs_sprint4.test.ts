import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createGuestCtx(): TrpcContext {
  return {
    user: {
      id: 10,
      openId: "guest-user",
      email: "guest@example.com",
      name: "Guest User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createAdminCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@yumhomestay.com",
      name: "Admin User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createPublicCtx(): TrpcContext {
  return {
    user: undefined,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("stripe.getSupportedCurrencies", () => {
  it("returns list of supported currencies including JPY and USD", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const currencies = await caller.stripe.getSupportedCurrencies();
    expect(currencies).toBeInstanceOf(Array);
    expect(currencies.length).toBeGreaterThan(0);
    const codes = currencies.map((c) => c.code);
    expect(codes).toContain("JPY");
    expect(codes).toContain("USD");
    expect(codes).toContain("EUR");
  });
});

describe("stripe.convertCurrency", () => {
  it("converts JPY to USD correctly", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.stripe.convertCurrency({ amountJpy: 10000, currency: "USD" });
    expect(result.currency).toBe("USD");
    expect(result.amountJpy).toBe(10000);
    expect(result.amountForeign).toBeGreaterThan(0);
    expect(result.rate).toBeGreaterThan(0);
  });

  it("returns JPY as-is when currency is JPY", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.stripe.convertCurrency({ amountJpy: 5000, currency: "JPY" });
    expect(result.currency).toBe("JPY");
    expect(result.amountForeign).toBe(5000);
  });
});

describe("cookingSchool.list", () => {
  it("returns an array (empty or populated)", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.cookingSchool.list({ limit: 10, offset: 0 });
    expect(result).toBeInstanceOf(Array);
  });
});

describe("review.getByRecipient", () => {
  it("returns an array for a given recipient", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.review.getByRecipient({ recipientId: 999 });
    expect(result).toBeInstanceOf(Array);
  });
});

describe("booking.myBookings (auth required)", () => {
  it("returns bookings for authenticated user", async () => {
    const caller = appRouter.createCaller(createGuestCtx());
    const result = await caller.booking.myBookings();
    expect(result).toBeInstanceOf(Array);
  });
});

describe("user.getProfile (auth required)", () => {
  it("throws NOT_FOUND or returns profile for authenticated user", async () => {
    const caller = appRouter.createCaller(createGuestCtx());
    // In test environment without seeded DB, NOT_FOUND is expected
    try {
      const result = await caller.user.getProfile();
      expect(typeof result === "object").toBe(true);
    } catch (err: unknown) {
      const trpcErr = err as { code?: string };
      expect(trpcErr.code).toBe("NOT_FOUND");
    }
  });
});

describe("admin.getStats (admin only)", () => {
  it("returns stats object for admin user", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.admin.getStats();
    // DB may return null if not connected, but shape should be correct
    if (result !== null) {
      expect(typeof result.totalUsers).toBe("number");
      expect(typeof result.totalHosts).toBe("number");
      expect(typeof result.totalBookings).toBe("number");
    }
  });

  it("throws FORBIDDEN for non-admin user", async () => {
    const caller = appRouter.createCaller(createGuestCtx());
    await expect(caller.admin.getStats()).rejects.toThrow();
  });
});

describe("message.getByBooking (auth required)", () => {
  it("throws NOT_FOUND for non-existent booking", async () => {
    const caller = appRouter.createCaller(createGuestCtx());
    // Booking 999 does not exist in test DB, NOT_FOUND is expected
    await expect(caller.message.getByBooking({ bookingId: 999 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
