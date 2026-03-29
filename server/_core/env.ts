export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // ─── Stripe ────────────────────────────────────────────────────────────────
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET_PROD ?? "",
  stripePublishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "",
  // ─── Resend (Email) ──────────────────────────────────────────────────────
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  emailFromAddress: process.env.EMAIL_FROM ?? "YumHomeStay <noreply@yumhomestay.com>",
  // ─── Google OAuth ──────────────────────────────────────────────────────
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  // ─── LINE Login ──────────────────────────────────────────────────────────
  lineClientId: process.env.LINE_CLIENT_ID ?? "",
  lineClientSecret: process.env.LINE_CLIENT_SECRET ?? "",
  // ─── App Base URL ──────────────────────────────────────────────────────
  appBaseUrl: process.env.APP_BASE_URL ?? "https://www.yumhomestay.com",
};
