import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Helper: create a mock context for an authenticated user
function createUserCtx(overrides?: Partial<TrpcContext["user"]>): TrpcContext {
  const user: NonNullable<TrpcContext["user"]> = {
    id: 999999,
    openId: "test-user-open-id",
    email: "guest@example.com",
    name: "Test Guest",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
  return {
    user,
    req: { protocol: "https", headers: {}, ip: "127.0.0.1" } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

// Helper: create a mock context for an admin user
function createAdminCtx(): TrpcContext {
  return createUserCtx({ role: "admin" });
}

// Helper: create an unauthenticated context
function createAnonCtx(): TrpcContext {
  return {
    user: undefined,
    req: { protocol: "https", headers: {}, ip: "127.0.0.1" } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

// ─── Auth ──────────────────────────────────────────────────────────────────────
describe("auth.me", () => {
  it("returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createAnonCtx());
    const result = await caller.auth.me();
    expect(result == null).toBe(true); // undefined or null when unauthenticated
  });

  it("returns user object for authenticated user", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const result = await caller.auth.me();
    expect(result).toBeTruthy();
    expect(result?.email).toBe("guest@example.com");
  });
});

// ─── Auth Logout ──────────────────────────────────────────────────────────────
describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const clearedCookies: string[] = [];
    const ctx = createUserCtx();
    ctx.res.clearCookie = (name: string) => { clearedCookies.push(name); };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(clearedCookies.length).toBeGreaterThan(0);
  });
});

// ─── Experience (public) ──────────────────────────────────────────────────────
describe("experience.list", () => {
  it("returns an array (possibly empty) without auth", async () => {
    const caller = appRouter.createCaller(createAnonCtx());
    const result = await caller.experience.list({});
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Booking ─────────────────────────────────────────────────────────────────
describe("booking.myBookings", () => {
  it("returns an array for authenticated user", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const result = await caller.booking.myBookings();
    expect(Array.isArray(result)).toBe(true);
  });

  it("throws UNAUTHORIZED for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createAnonCtx());
    await expect(caller.booking.myBookings()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

// ─── Admin ────────────────────────────────────────────────────────────────────
describe("admin.getStats", () => {
  it("throws UNAUTHORIZED for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createAnonCtx());
    await expect(caller.admin.getStats()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("throws FORBIDDEN for non-admin user", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    await expect(caller.admin.getStats()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

// ─── Payment ─────────────────────────────────────────────────────────────────
describe("payment.getCurrencies", () => {
  it("returns supported currencies list", async () => {
    const caller = appRouter.createCaller(createAnonCtx());
    const result = await caller.payment.getCurrencies();
    expect(result.currencies).toContain("JPY");
    expect(result.currencies).toContain("USD");
    expect(result.currencies).toContain("EUR");
  });
});

// ─── Host ─────────────────────────────────────────────────────────────────────
describe("host.getMyHost", () => {
  it("returns null when user has no host profile", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const result = await caller.host.getMyHost();
    expect(result == null).toBe(true); // undefined or null when unauthenticated
  });

  it("throws UNAUTHORIZED for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createAnonCtx());
    await expect(caller.host.getMyHost()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

// ─── Stripe ──────────────────────────────────────────────────────────────────
describe("stripe.getSupportedCurrencies", () => {
  it("returns list of supported currencies including JPY and USD", async () => {
    const caller = appRouter.createCaller(createAnonCtx());
    const result = await caller.stripe.getSupportedCurrencies();
    expect(Array.isArray(result)).toBe(true);
    const codes = result.map((c: { code: string }) => c.code);
    expect(codes).toContain("JPY");
    expect(codes).toContain("USD");
    expect(codes).toContain("EUR");
  });
});

describe("stripe.convertCurrency", () => {
  it("returns JPY amount unchanged when currency is JPY", async () => {
    const caller = appRouter.createCaller(createAnonCtx());
    const result = await caller.stripe.convertCurrency({ amountJpy: 20000, currency: "JPY" });
    expect(result.amountForeign).toBe(20000);
    expect(result.currency).toBe("JPY");
  });

  it("converts JPY to USD with a reasonable rate", async () => {
    const caller = appRouter.createCaller(createAnonCtx());
    const result = await caller.stripe.convertCurrency({ amountJpy: 20000, currency: "USD" });
    expect(result.currency).toBe("USD");
    // USD rate should be around 0.0067, so 20000 * 0.0067 ≈ 134
    expect(result.amountForeign).toBeGreaterThan(50);
    expect(result.amountForeign).toBeLessThan(500);
  });
});

describe("stripe.createCheckoutSession", () => {
  it("throws UNAUTHORIZED for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createAnonCtx());
    await expect(
      caller.stripe.createCheckoutSession({ bookingId: 1, currency: "JPY" })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("throws NOT_FOUND for non-existent booking", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    await expect(
      caller.stripe.createCheckoutSession({ bookingId: 999999, currency: "JPY" })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("stripe.getPaymentStatus", () => {
  it("throws UNAUTHORIZED for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createAnonCtx());
    await expect(
      caller.stripe.getPaymentStatus({ bookingId: 1 })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("throws NOT_FOUND for non-existent booking", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    await expect(
      caller.stripe.getPaymentStatus({ bookingId: 999999 })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
