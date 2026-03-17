/**
 * YumHomeStay OTA Public API
 * 
 * Endpoints:
 *   GET  /api/ota/v1/experiences        - List available experiences
 *   GET  /api/ota/v1/experiences/:id    - Get experience detail
 *   POST /api/ota/v1/bookings           - Create booking (OTA partner)
 *   GET  /api/ota/v1/bookings/:id       - Get booking status
 *   POST /api/ota/v1/webhooks/register  - Register webhook endpoint
 * 
 * Authentication: Bearer token (API key stored in apiKeys table)
 * Rate limiting: 100 req/min per API key
 */
import type { Express, Request, Response } from "express";
import { getDb } from "../db";
import { experiences, hosts, bookings, users } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import {
  YHS_BASE_PRICE_JPY,
  YHS_EXTRA_ADULT_JPY,
  YHS_EXTRA_CHILD_JPY,
  YHS_EXTRA_INFANT_JPY,
  YHS_AGENT_FEE_JPY,
  YHS_HOST_PAYOUT_JPY,
  YHS_CARD_FEE_RATE,
  YHS_AFFILIATE_FEE_JPY,
  calcTotalSalesJpy,
  calcProfitBreakdown,
} from "../../shared/pricing";

// ─── API Key Auth Middleware ──────────────────────────────────────────────────
const API_KEYS: Record<string, { name: string; agentId?: number }> = {};

// In production, these would be stored in DB. For demo, use env or hardcoded test key.
const DEMO_OTA_API_KEY = process.env.OTA_API_KEY || "yhs-ota-demo-key-2026";
API_KEYS[DEMO_OTA_API_KEY] = { name: "Demo OTA Partner" };

function requireApiKey(req: Request, res: Response, next: () => void) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header. Use: Bearer <api_key>" });
  }
  const key = auth.slice(7);
  const partner = API_KEYS[key];
  if (!partner) {
    return res.status(401).json({ error: "Invalid API key" });
  }
  (req as Request & { otaPartner: typeof partner }).otaPartner = partner;
  next();
}

// ─── Register OTA API Routes ──────────────────────────────────────────────────
export function registerOtaApiRoutes(app: Express) {
  const base = "/api/ota/v1";

  /**
   * GET /api/ota/v1/experiences
   * List all active, approved experiences.
   * Query params: prefecture, cuisineType, page (default 1), limit (default 20, max 100)
   */
  app.get(`${base}/experiences`, requireApiKey, async (req: Request, res: Response) => {
    try {
      const page = Math.max(1, parseInt(String(req.query.page ?? "1")));
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"))));
      const offset = (page - 1) * limit;

      const db = await getDb();
      if (!db) return res.status(503).json({ error: "Database unavailable" });

      let query = db
        .select({
          id: experiences.id,
          titleJa: experiences.titleJa,
          titleEn: experiences.titleEn,
          descriptionJa: experiences.descriptionJa,
          descriptionEn: experiences.descriptionEn,
          priceJpy: experiences.priceJpy,
          durationMinutes: experiences.durationMinutes,
          maxGuests: experiences.maxGuests,
          minGuests: experiences.minGuests,
          cuisineType: experiences.cuisineType,
          experienceType: experiences.experienceType,
          dietaryOptions: experiences.dietaryOptions,
          cancellationPolicy: experiences.cancellationPolicy,
          imageUrls: experiences.imageUrls,
          hostId: experiences.hostId,
          hostPrefecture: hosts.prefecture,
          hostCity: hosts.city,
          hostNearestStation: hosts.nearestStation,
          hostLanguages: hosts.languages,
        })
        .from(experiences)
        .leftJoin(hosts, eq(experiences.hostId, hosts.id))
        .where(and(
          eq(experiences.isActive, true),
          eq(experiences.approvalStatus, "approved")
        ))
        .limit(limit)
        .offset(offset);

      const rows = await query;

      // Filter by prefecture if provided
      const prefecture = req.query.prefecture as string | undefined;
      const cuisineType = req.query.cuisineType as string | undefined;
      let filtered = rows;
      if (prefecture) {
        filtered = filtered.filter(r => r.hostPrefecture === prefecture);
      }
      if (cuisineType) {
        filtered = filtered.filter(r => r.cuisineType === cuisineType);
      }

      res.json({
        data: filtered.map(r => ({
          ...r,
          imageUrls: r.imageUrls ? JSON.parse(r.imageUrls) : [],
          dietaryOptions: r.dietaryOptions ? JSON.parse(r.dietaryOptions) : [],
          hostLanguages: r.hostLanguages ? JSON.parse(r.hostLanguages) : [],
          // YHS fixed pricing info
          pricing: {
            baseJpy: YHS_BASE_PRICE_JPY,
            note: `Base price for 2 adults (tax-incl). Extra adult: +¥${YHS_EXTRA_ADULT_JPY.toLocaleString()}, child (5+): +¥${YHS_EXTRA_CHILD_JPY.toLocaleString()}, infant (<5): +¥${YHS_EXTRA_INFANT_JPY.toLocaleString()}`,
            extraAdultJpy: YHS_EXTRA_ADULT_JPY,
            extraChildJpy: YHS_EXTRA_CHILD_JPY,
            extraInfantJpy: YHS_EXTRA_INFANT_JPY,
          },
          // YHS rules
          rules: {
            minAdults: 2,
            videoCallRequired: true,
            videoCallDurationMinutes: 10,
            hostMinFamilyMembers: 2,
          },
        })),
        pagination: {
          page,
          limit,
          total: rows.length,
        },
        _links: {
          self: `${base}/experiences?page=${page}&limit=${limit}`,
          next: rows.length === limit ? `${base}/experiences?page=${page + 1}&limit=${limit}` : null,
        },
      });
    } catch (err) {
      console.error("[OTA API] GET /experiences error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * GET /api/ota/v1/experiences/:id
   * Get a single experience by ID.
   */
  app.get(`${base}/experiences/:id`, requireApiKey, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid experience ID" });

      const db = await getDb();
      if (!db) return res.status(503).json({ error: "Database unavailable" });

      const rows = await db
        .select({
          id: experiences.id,
          titleJa: experiences.titleJa,
          titleEn: experiences.titleEn,
          descriptionJa: experiences.descriptionJa,
          descriptionEn: experiences.descriptionEn,
          priceJpy: experiences.priceJpy,
          durationMinutes: experiences.durationMinutes,
          maxGuests: experiences.maxGuests,
          minGuests: experiences.minGuests,
          cuisineType: experiences.cuisineType,
          experienceType: experiences.experienceType,
          dietaryOptions: experiences.dietaryOptions,
          cancellationPolicy: experiences.cancellationPolicy,
          imageUrls: experiences.imageUrls,
          hostId: experiences.hostId,
          hostPrefecture: hosts.prefecture,
          hostCity: hosts.city,
          hostNearestStation: hosts.nearestStation,
          hostLanguages: hosts.languages,
          hostBioEn: hosts.bioEn,
          hostBioJa: hosts.bioJa,
        })
        .from(experiences)
        .leftJoin(hosts, eq(experiences.hostId, hosts.id))
        .where(and(
          eq(experiences.id, id),
          eq(experiences.isActive, true),
          eq(experiences.approvalStatus, "approved")
        ))
        .limit(1);

      if (!rows.length) return res.status(404).json({ error: "Experience not found" });
      const r = rows[0];

      res.json({
        data: {
          ...r,
          imageUrls: r.imageUrls ? JSON.parse(r.imageUrls) : [],
          dietaryOptions: r.dietaryOptions ? JSON.parse(r.dietaryOptions) : [],
          hostLanguages: r.hostLanguages ? JSON.parse(r.hostLanguages) : [],
          pricing: {
            baseJpy: YHS_BASE_PRICE_JPY,
            note: `Base price for 2 adults (tax-incl). Extra adult: +¥${YHS_EXTRA_ADULT_JPY.toLocaleString()}, child (5+): +¥${YHS_EXTRA_CHILD_JPY.toLocaleString()}, infant (<5): +¥${YHS_EXTRA_INFANT_JPY.toLocaleString()}`,
            extraAdultJpy: YHS_EXTRA_ADULT_JPY,
            extraChildJpy: YHS_EXTRA_CHILD_JPY,
            extraInfantJpy: YHS_EXTRA_INFANT_JPY,
          },
          rules: {
            minAdults: 2,
            videoCallRequired: true,
            videoCallDurationMinutes: 10,
            hostMinFamilyMembers: 2,
          },
        },
      });
    } catch (err) {
      console.error("[OTA API] GET /experiences/:id error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * POST /api/ota/v1/bookings
   * Create a booking on behalf of an OTA guest.
   * 
   * Body:
   *   experienceId: number
   *   startTime: ISO string (e.g. "2026-04-15T10:00:00Z")
   *   adultsCount: number (min 2)
   *   childrenCount?: number
   *   infantsCount?: number
   *   guestName: string
   *   guestEmail: string
   *   guestNationality?: string
   *   dietaryRestrictions?: string
   *   specialRequests?: string
   *   pickupStation?: string
   *   videoCallPreferredTimes: string[] (min 1, ISO datetime strings)
   *   agentReference?: string (OTA's own booking reference)
   */
  app.post(`${base}/bookings`, requireApiKey, async (req: Request, res: Response) => {
    try {
      const {
        experienceId,
        startTime,
        adultsCount = 2,
        childrenCount = 0,
        infantsCount = 0,
        guestName,
        guestEmail,
        dietaryRestrictions,
        specialRequests,
        pickupStation,
        videoCallPreferredTimes = [],
        agentReference,
      } = req.body;

      // Validation
      if (!experienceId || !startTime || !guestName || !guestEmail) {
        return res.status(400).json({
          error: "Missing required fields: experienceId, startTime, guestName, guestEmail",
        });
      }
      if (adultsCount < 2) {
        return res.status(400).json({ error: "YHS Rule: minimum 2 adults required per booking" });
      }
      if (!videoCallPreferredTimes || videoCallPreferredTimes.length === 0) {
        return res.status(400).json({ error: "YHS Rule: at least 1 video call preferred time is required" });
      }

      const db = await getDb();
      if (!db) return res.status(503).json({ error: "Database unavailable" });

      // Verify experience exists and is active
      const expRows = await db
        .select()
        .from(experiences)
        .where(and(eq(experiences.id, experienceId), eq(experiences.isActive, true), eq(experiences.approvalStatus, "approved")))
        .limit(1);
      if (!expRows.length) {
        return res.status(404).json({ error: "Experience not found or not available" });
      }
      const exp = expRows[0];

      const totalGuests = adultsCount + childrenCount + infantsCount;
      if (totalGuests > exp.maxGuests) {
        return res.status(400).json({ error: `Too many guests. Maximum: ${exp.maxGuests}` });
      }

      // YHS Fixed Pricing (shared/pricing.ts)
      const extraAdults = Math.max(0, adultsCount - 2);
      const basePriceJpy = YHS_BASE_PRICE_JPY;                          // ¥55,000 (2名基本)
      const extraAdultPriceJpy = extraAdults * YHS_EXTRA_ADULT_JPY;    // ¥22,000/名
      const extraChildPriceJpy = childrenCount * YHS_EXTRA_CHILD_JPY;  // ¥11,000/名
      const extraInfantPriceJpy = infantsCount * YHS_EXTRA_INFANT_JPY; // ¥5,500/名
      const amountJpy = basePriceJpy + extraAdultPriceJpy + extraChildPriceJpy + extraInfantPriceJpy;
      // OTA経由は常に代理店あり
      const breakdown = calcProfitBreakdown(amountJpy, true);
      const agentFeeJpy = breakdown.agentFeeJpy;         // ¥8,800
      const cardFeeJpy = breakdown.cardFeeJpy;           // 5%
      const affiliateFeeJpy = breakdown.affiliateFeeJpy; // ¥2,200
      const hostPayoutJpy = breakdown.hostPayoutJpy;     // ¥25,000
      const platformProfitJpy = breakdown.platformProfitJpy;
      const serviceFeeJpy = agentFeeJpy + cardFeeJpy + affiliateFeeJpy;

      const start = new Date(startTime);
      const end = new Date(start.getTime() + 4 * 60 * 60 * 1000);

      // Find or create guest user (OTA guest)
      let guestUser = await db.select().from(users).where(eq(users.email, guestEmail)).limit(1);
      let guestId: number;
      if (guestUser.length) {
        guestId = guestUser[0].id;
      } else {
        // Create a placeholder user for the OTA guest
        const inserted = await db.insert(users).values({
          openId: `ota-guest-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: guestName,
          email: guestEmail,
          loginMethod: "ota",
          userType: "guest",
          identityStatus: "pending",
        });
        const [header] = inserted as unknown as [{ insertId: number }];
        guestId = Number(header.insertId);
      }

      // Create booking
      const specialNote = [
        `[OTA予約] ${agentReference ? "代理店参照: " + agentReference : ""}`,
        `[ビデオ面談希望] ${videoCallPreferredTimes.join(" / ")}`,
        specialRequests,
      ].filter(Boolean).join(" | ");

      const inserted = await db.insert(bookings).values({
        guestId,
        hostId: exp.hostId,
        experienceId: exp.id,
        startTime: start,
        endTime: end,
        adultsCount,
        childrenCount,
        infantsCount,
        basePriceJpy,
        extraAdultPriceJpy,
        extraChildPriceJpy,
        extraInfantPriceJpy,
        amountTotal: amountJpy,
        currency: "JPY",
        exchangeRateToJpy: "1.000000",
        amountJpy,
        serviceFeeJpy,
        hostPayoutJpy,
        agentFeeJpy,
        agentBonusFeeJpy: 0,
        cardFeeJpy,
        affiliateFeeJpy,
        platformProfitJpy,
        pickupStation,
        dietaryRestrictions,
        specialRequests: specialNote,
        status: "pending",
        videoCallRequired: true,
      });

      const [bookingHeader] = inserted as unknown as [{ insertId: number }];
      const bookingId = Number(bookingHeader.insertId);

      res.status(201).json({
        data: {
          bookingId,
          status: "pending",
          amountJpy,
          agentFeeJpy,
          hostPayoutJpy,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          message: "Booking created. A YHS staff member will contact the guest to schedule the required 10-minute video call.",
          _links: {
            self: `${base}/bookings/${bookingId}`,
          },
        },
      });
    } catch (err) {
      console.error("[OTA API] POST /bookings error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * GET /api/ota/v1/bookings/:id
   * Get booking status (OTA partner can check their booking).
   */
  app.get(`${base}/bookings/:id`, requireApiKey, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid booking ID" });

      const db = await getDb();
      if (!db) return res.status(503).json({ error: "Database unavailable" });

      const rows = await db
        .select({
          id: bookings.id,
          status: bookings.status,
          startTime: bookings.startTime,
          endTime: bookings.endTime,
          adultsCount: bookings.adultsCount,
          childrenCount: bookings.childrenCount,
          infantsCount: bookings.infantsCount,
          amountJpy: bookings.amountJpy,
          agentFeeJpy: bookings.agentFeeJpy,
          hostPayoutJpy: bookings.hostPayoutJpy,
          pickupStation: bookings.pickupStation,
          videoCallRequired: bookings.videoCallRequired,
          videoCallScheduledAt: bookings.videoCallScheduledAt,
          videoCallCompletedAt: bookings.videoCallCompletedAt,
          confirmedAt: bookings.confirmedAt,
          completedAt: bookings.completedAt,
          cancelledAt: bookings.cancelledAt,
          cancellationReason: bookings.cancellationReason,
          createdAt: bookings.createdAt,
        })
        .from(bookings)
        .where(eq(bookings.id, id))
        .limit(1);

      if (!rows.length) return res.status(404).json({ error: "Booking not found" });

      res.json({ data: rows[0] });
    } catch (err) {
      console.error("[OTA API] GET /bookings/:id error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * GET /api/ota/v1/docs
   * API documentation (JSON schema)
   */
  app.get(`${base}/docs`, (_req: Request, res: Response) => {
    res.json({
      name: "YumHomeStay OTA Public API",
      version: "1.0.0",
      baseUrl: base,
      authentication: {
        type: "Bearer Token",
        header: "Authorization: Bearer <api_key>",
        note: "Contact YHS to obtain your API key",
      },
      endpoints: [
        {
          method: "GET",
          path: `${base}/experiences`,
          description: "List available experiences",
          queryParams: {
            prefecture: "Filter by prefecture (e.g. 東京都)",
            cuisineType: "Filter by cuisine type",
            page: "Page number (default: 1)",
            limit: "Items per page (default: 20, max: 100)",
          },
        },
        {
          method: "GET",
          path: `${base}/experiences/:id`,
          description: "Get experience detail",
        },
        {
          method: "POST",
          path: `${base}/bookings`,
          description: "Create a booking",
          requiredFields: ["experienceId", "startTime", "adultsCount (min 2)", "guestName", "guestEmail", "videoCallPreferredTimes (array, min 1)"],
          yhsRules: [
            "Minimum 2 adults per booking",
            "10-minute video call required before visit",
            "Host must have 2+ family members",
            "Fixed pricing: base ¥20,000 (2 adults, 4h) + extras",
          ],
        },
        {
          method: "GET",
          path: `${base}/bookings/:id`,
          description: "Get booking status",
        },
      ],
      pricing: {
        base: "¥20,000 (2 adults, 4 hours)",
        extraAdult: "¥20,000 per additional adult",
        extraChild: "¥12,000 per child (age 5+)",
        extraInfant: "¥5,000 per infant (under 5)",
        agentFee: "¥8,500 base commission per booking",
        agentBonus: "¥1,500–¥3,500 monthly bonus (based on volume)",
        paymentSchedule: "End of month, paid by 10th of following month",
      },
    });
  });

  console.log("[OTA API] Routes registered at", base);
}
