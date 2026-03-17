/**
 * Resend API Key validation test
 */
import { describe, it, expect } from "vitest";

describe("Resend API Key", () => {
  it("RESEND_API_KEY is set in environment", () => {
    const key = process.env.RESEND_API_KEY;
    expect(key).toBeTruthy();
    expect(key).toMatch(/^re_/);
  });

  it("Resend API accepts the key (send to test address)", async () => {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY not set");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "YumHomeStay <onboarding@resend.dev>",
        to: ["delivered@resend.dev"],
        subject: "YumHomeStay API Key Validation",
        html: "<p>This is a validation test email from YumHomeStay.</p>",
      }),
    });

    const data = await res.json() as { id?: string; statusCode?: number; message?: string };
    console.log("[Resend Test] Response:", JSON.stringify(data));

    // Resend returns 200 with an id on success
    expect(res.ok).toBe(true);
    expect(data.id).toBeTruthy();
  }, 15000);
});
