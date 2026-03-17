import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Trust reverse proxy (Cloudflare / Manus edge) so rate-limit sees real client IP
  // Always enable: Manus dev environment also routes through a reverse proxy
  app.set("trust proxy", 1);

  // ── Security: HTTP headers ───────────────────────────────────────────────
  app.use(helmet({
    contentSecurityPolicy: false, // Vite dev server injects inline scripts
    crossOriginEmbedderPolicy: false,
  }));

  // ── Security: Rate limiting ──────────────────────────────────────────────
  // General API limiter: 200 req/min per IP
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
  });
  // Strict limiter for auth/mutation endpoints: 30 req/min per IP
  const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
  });
  app.use("/api/trpc", apiLimiter);
  app.use("/api/oauth", authLimiter);

  // Configure body parser with larger size limit for file uploads
  // NOTE: Stripe webhook raw body parsing is handled inline in registerStripeWebhook()
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Stripe webhook endpoint
  const { registerStripeWebhook } = await import("../routers/stripe");
  registerStripeWebhook(app);
  // OTA Public API
  const { registerOtaApiRoutes } = await import("../routers/otaApi");
  registerOtaApiRoutes(app);
  // Demo Login (development/demo purposes only)
  const { registerDemoLoginRoutes } = await import("../demoLogin");
  registerDemoLoginRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);

// Start reminder email scheduler (runs every 30 minutes)
import("../reminderJob").then(({ startReminderScheduler }) => {
  startReminderScheduler();
}).catch((err) => console.error("[Reminder] Failed to start scheduler:", err));
