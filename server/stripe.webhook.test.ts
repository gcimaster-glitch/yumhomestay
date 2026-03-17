/**
 * Stripe Webhook & KYC Integration Tests
 * - Webhook secret candidates are configured correctly
 * - Stripe Identity VerificationSession can be created with type:'document'
 * - Webhook handler correctly processes checkout.session.completed events
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import Stripe from "stripe";

// ── 1. Webhook secret candidates ──────────────────────────────────────────────
describe("Stripe Webhook Secret Configuration", () => {
  it("should have STRIPE_WEBHOOK_SECRET_PROD set", () => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET_PROD;
    expect(secret).toBeDefined();
    expect(secret).toMatch(/^whsec_/);
  });

  it("should have STRIPE_SECRET_KEY set", () => {
    const key = process.env.STRIPE_SECRET_KEY;
    expect(key).toBeDefined();
    expect(key!.length).toBeGreaterThan(10);
  });
});

// ── 2. Stripe Identity VerificationSession creation ───────────────────────────
describe("Stripe Identity VerificationSession", () => {
  it("should create a VerificationSession with type:document", async () => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-02-25.clover",
    });

    const session = await stripe.identity.verificationSessions.create({
      type: "document",
      options: {
        document: {
          allowed_types: ["passport", "driving_license", "id_card"],
          require_id_number: false,
          require_live_capture: true,
          require_matching_selfie: true,
        },
      },
      metadata: { user_id: "test-user", test: "true" },
      return_url: "https://yumhomestay.com/kyc/return",
    });

    expect(session.id).toMatch(/^vs_/);
    expect(session.status).toBe("requires_input");
    expect(session.type).toBe("document");
    expect(session.client_secret).toBeDefined();

    // Clean up
    await stripe.identity.verificationSessions.cancel(session.id);
  }, 20000);
});

// ── 3. Webhook signature verification ─────────────────────────────────────────
describe("Stripe Webhook Signature Verification", () => {
  it("should verify webhook signature with STRIPE_WEBHOOK_SECRET_PROD", () => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-02-25.clover",
    });
    const secret = process.env.STRIPE_WEBHOOK_SECRET_PROD!;

    // Build a minimal payload and sign it
    const payload = JSON.stringify({
      id: "evt_test_webhook_verification",
      object: "event",
      type: "checkout.session.completed",
      data: { object: {} },
    });
    const timestamp = Math.floor(Date.now() / 1000);
    const signedPayload = `${timestamp}.${payload}`;
    const crypto = require("crypto");
    const signature = crypto
      .createHmac("sha256", secret)
      .update(signedPayload)
      .digest("hex");
    const header = `t=${timestamp},v1=${signature}`;

    // Verify
    const event = stripe.webhooks.constructEvent(
      Buffer.from(payload),
      header,
      secret
    );
    expect(event.type).toBe("checkout.session.completed");
  });

  it("should have correct webhook URL registered", async () => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-02-25.clover",
    });
    const webhooks = await stripe.webhookEndpoints.list({ limit: 10 });
    const prodWebhook = webhooks.data.find(
      (w) => w.url === "https://yumhomestay.com/api/stripe/webhook"
    );
    expect(prodWebhook).toBeDefined();
    expect(prodWebhook!.status).toBe("enabled");
    // Identity events should be included
    expect(prodWebhook!.enabled_events).toContain(
      "identity.verification_session.verified"
    );
    expect(prodWebhook!.enabled_events).toContain(
      "checkout.session.completed"
    );
  }, 15000);
});
