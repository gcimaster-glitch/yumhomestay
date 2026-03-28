import { and, desc, eq, gte, isNull, lt, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {
  type InsertUser,
  type InsertExperienceReview,
  agentMembers,
  agents,
  auditLogs,
  bookings,
  cookingSchools,
  coupons,
  exchangeRates,
  experienceReviews,
  experiences,
  hosts,
  messages,
  notifications,
  payments,
  payouts,
  reviews,
  troubleReports,
  users,
  hostAvailability,
  type InsertHostAvailability,
  guestInquiries,
  type GuestInquiry,
  type InsertGuestInquiry,
  bookingChats,
  type InsertBookingChat,
  leads,
  type Lead,
  type InsertLead,
  contactInquiries,
  type ContactInquiry,
  type InsertContactInquiry,
  kycSubmissions,
  type KycSubmission,
  type InsertKycSubmission,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // createPool を使用して接続プールを作成する。
      // createConnection と異なり、プールはアイドルタイムアウト後に自動再接続するため
      // 「Can't add new command when connection is in closed state」エラーを防ぐ。
      const pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: true },
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });
      _db = drizzle(pool);
      console.log("[Database] Connection pool initialized");
    } catch (error) {
      console.warn("[Database] Failed to initialize pool:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    values.userType = "admin";
    updateSet.role = "admin";
    updateSet.userType = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getAllUsers(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(isNull(users.deletedAt)).limit(limit).offset(offset).orderBy(desc(users.createdAt));
}

export async function updateUser(id: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, id));
}

// ─── Hosts ────────────────────────────────────────────────────────────────────
export async function getHostByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(hosts).where(eq(hosts.userId, userId)).limit(1);
  return result[0];
}

export async function getHostById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(hosts).where(eq(hosts.id, id)).limit(1);
  return result[0];
}

export async function createHost(data: typeof hosts.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(hosts).values(data);
  return result;
}

export async function updateHost(id: number, data: Partial<typeof hosts.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(hosts).set(data).where(eq(hosts.id, id));
}

export async function getApprovedHosts(limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(hosts)
    .where(and(eq(hosts.approvalStatus, "approved"), eq(hosts.isActive, true)))
    .limit(limit)
    .offset(offset)
    .orderBy(desc(hosts.createdAt));
}

export async function getAllHosts(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(hosts).limit(limit).offset(offset).orderBy(desc(hosts.createdAt));
}

// ─── Experiences ──────────────────────────────────────────────────────────────
export async function getExperienceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(experiences).where(eq(experiences.id, id)).limit(1);
  return result[0];
}

export async function getExperiencesByHostId(hostId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(experiences).where(eq(experiences.hostId, hostId)).orderBy(desc(experiences.createdAt));
}

export async function getExperiencesByCookingSchoolId(cookingSchoolId: number) {
  const db = await getDb();
  if (!db) return [];
  // Join experiences -> hosts -> cookingSchools to get experiences for a specific cooking school
  return db
    .select({
      id: experiences.id,
      hostId: experiences.hostId,
      titleJa: experiences.titleJa,
      titleEn: experiences.titleEn,
      descriptionJa: experiences.descriptionJa,
      descriptionEn: experiences.descriptionEn,
      priceJpy: experiences.priceJpy,
      durationMinutes: experiences.durationMinutes,
      maxGuests: experiences.maxGuests,
      minGuests: experiences.minGuests,
      cuisineType: experiences.cuisineType,
      dietaryOptions: experiences.dietaryOptions,
      experienceType: experiences.experienceType,
      cancellationPolicy: experiences.cancellationPolicy,
      approvalStatus: experiences.approvalStatus,
      isActive: experiences.isActive,
      imageUrls: experiences.imageUrls,
      createdAt: experiences.createdAt,
      updatedAt: experiences.updatedAt,
    })
    .from(experiences)
    .innerJoin(hosts, eq(experiences.hostId, hosts.id))
    .where(
      and(
        eq(hosts.cookingSchoolId, cookingSchoolId),
        eq(experiences.approvalStatus, "approved"),
        eq(experiences.isActive, true)
      )
    )
    .orderBy(experiences.priceJpy);
}

export async function getActiveExperiences(limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(experiences)
    .where(and(eq(experiences.approvalStatus, "approved"), eq(experiences.isActive, true)))
    .limit(limit)
    .offset(offset)
    .orderBy(desc(experiences.createdAt));
}

export async function getAllExperiences(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(experiences).limit(limit).offset(offset).orderBy(desc(experiences.createdAt));
}

export async function createExperience(data: typeof experiences.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(experiences).values(data);
  return result;
}

export async function updateExperience(id: number, data: Partial<typeof experiences.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(experiences).set(data).where(eq(experiences.id, id));
}

// ─── Bookings ─────────────────────────────────────────────────────────────────
export async function getBookingById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  return result[0];
}

export async function getBookingsByGuestId(guestId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings).where(eq(bookings.guestId, guestId)).orderBy(desc(bookings.createdAt));
}

export async function getBookingsByHostId(hostId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings).where(eq(bookings.hostId, hostId)).orderBy(desc(bookings.createdAt));
}

export async function getAllBookings(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings).limit(limit).offset(offset).orderBy(desc(bookings.createdAt));
}

export async function createBooking(data: typeof bookings.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(bookings).values(data);
  return result;
}

export async function updateBooking(id: number, data: Partial<typeof bookings.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(bookings).set(data).where(eq(bookings.id, id));
}

// ─── Payments ─────────────────────────────────────────────────────────────────
export async function getPaymentByBookingId(bookingId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(payments).where(eq(payments.bookingId, bookingId)).limit(1);
  return result[0];
}

export async function createPayment(data: typeof payments.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(payments).values(data);
  return result;
}

export async function updatePayment(id: number, data: Partial<typeof payments.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(payments).set(data).where(eq(payments.id, id));
}

export async function updatePaymentByIntentId(intentId: string, data: Partial<typeof payments.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(payments).set(data).where(eq(payments.stripePaymentIntentId, intentId));
}

// ─── Reviews ──────────────────────────────────────────────────────────────────
export async function getReviewsByBookingId(bookingId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reviews).where(eq(reviews.bookingId, bookingId));
}

export async function getPublishedReviewsByRecipient(recipientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(reviews)
    .where(and(eq(reviews.recipientId, recipientId), eq(reviews.isPublished, true)))
    .orderBy(desc(reviews.createdAt));
}

export async function createReview(data: typeof reviews.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(reviews).values(data);
  return result;
}

export async function updateReview(id: number, data: Partial<typeof reviews.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(reviews).set(data).where(eq(reviews.id, id));
}

// ─── Messages ─────────────────────────────────────────────────────────────────
export async function getMessagesByBookingId(bookingId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(eq(messages.bookingId, bookingId)).orderBy(messages.createdAt);
}

export async function createMessage(data: typeof messages.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(messages).values(data);
  return result;
}

// ─── Exchange Rates ───────────────────────────────────────────────────────────
export async function getLatestExchangeRate(currency: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(exchangeRates)
    .where(eq(exchangeRates.currency, currency))
    .orderBy(desc(exchangeRates.fetchedAt))
    .limit(1);
  return result[0];
}

export async function upsertExchangeRate(currency: string, rateToJpy: number) {
  const db = await getDb();
  if (!db) return;
  await db.insert(exchangeRates).values({ currency, rateToJpy: rateToJpy.toString() });
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────
export async function createAuditLog(data: typeof auditLogs.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(auditLogs).values(data);
  } catch (e) {
    console.error("[AuditLog] Failed to write:", e);
  }
}

export async function getAuditLogs(limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLogs).limit(limit).offset(offset).orderBy(desc(auditLogs.createdAt));
}

// ─── Notifications ────────────────────────────────────────────────────────────
export async function createNotification(data: typeof notifications.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(data);
}

export async function getNotificationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}

export async function markNotificationRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

// ─── Agents ───────────────────────────────────────────────────────────────────
export async function getAgentByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const member = await db.select().from(agentMembers).where(eq(agentMembers.userId, userId)).limit(1);
  if (!member[0]) return undefined;
  const agent = await db.select().from(agents).where(eq(agents.id, member[0].agentId)).limit(1);
  return agent[0];
}
export async function getBookingsByAgentId(agentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings).where(eq(bookings.agentId, agentId)).orderBy(bookings.startTime);
}

// ─── Cooking Schools ─────────────────────────────────────────────────────────────────────────────
export async function getCookingSchoolByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(cookingSchools).where(eq(cookingSchools.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function getCookingSchoolById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(cookingSchools).where(eq(cookingSchools.id, id)).limit(1);
  return result[0] ?? null;
}

export async function createCookingSchool(data: typeof cookingSchools.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(cookingSchools).values(data);
}

export async function updateCookingSchool(id: number, data: Partial<typeof cookingSchools.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(cookingSchools).set(data).where(eq(cookingSchools.id, id));
}

export async function getActiveCookingSchools(limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(cookingSchools)
    .where(and(eq(cookingSchools.approvalStatus, "approved"), eq(cookingSchools.isActive, true)))
    .limit(limit)
    .offset(offset)
    .orderBy(desc(cookingSchools.createdAt));
}

export async function getAllCookingSchools(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cookingSchools).limit(limit).offset(offset).orderBy(desc(cookingSchools.createdAt));
}

// ─── Coupons ─────────────────────────────────────────────────────────────────────────────
export async function getCouponByCode(code: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(coupons).where(and(eq(coupons.code, code), eq(coupons.isActive, true))).limit(1);
  return result[0] ?? null;
}

export async function getAllCoupons() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(coupons).orderBy(desc(coupons.createdAt));
}

export async function createCoupon(data: typeof coupons.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(coupons).values(data);
}

export async function updateCoupon(id: number, data: Partial<typeof coupons.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(coupons).set(data).where(eq(coupons.id, id));
}

// ─── Trouble Reports ────────────────────────────────────────────────────────────────────────
export async function createTroubleReport(data: typeof troubleReports.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(troubleReports).values(data);
}

export async function getAllTroubleReports(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(troubleReports).limit(limit).offset(offset).orderBy(desc(troubleReports.createdAt));
}

export async function updateTroubleReport(id: number, data: Partial<typeof troubleReports.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(troubleReports).set(data).where(eq(troubleReports.id, id));
}
// ─── Stats ─────────────────────────────────────────────────────────────────────────────
export async function getAdminStats() {
  const db = await getDb();
  if (!db) return null;

  const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [totalHosts] = await db.select({ count: sql<number>`count(*)` }).from(hosts);
  const [totalBookings] = await db.select({ count: sql<number>`count(*)` }).from(bookings);
  const [pendingHosts] = await db
    .select({ count: sql<number>`count(*)` })
    .from(hosts)
    .where(eq(hosts.approvalStatus, "pending"));
  const [totalRevenue] = await db
    .select({ total: sql<number>`COALESCE(SUM(serviceFeeJpy), 0)` })
    .from(bookings)
    .where(eq(bookings.status, "completed"));

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [currentMonthRevenue] = await db
    .select({ total: sql<number>`COALESCE(SUM(serviceFeeJpy), 0)` })
    .from(bookings)
    .where(and(eq(bookings.status, "completed"), gte(bookings.completedAt, startOfMonth)));

  const [lastMonthRevenue] = await db
    .select({ total: sql<number>`COALESCE(SUM(serviceFeeJpy), 0)` })
    .from(bookings)
    .where(and(
      eq(bookings.status, "completed"),
      gte(bookings.completedAt, startOfLastMonth),
      lt(bookings.completedAt, startOfMonth)
    ));

  const [currentMonthUsers] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(gte(users.createdAt, startOfMonth));

  const [lastMonthUsers] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(and(gte(users.createdAt, startOfLastMonth), lt(users.createdAt, startOfMonth)));

  return {
    totalUsers: Number(totalUsers?.count ?? 0),
    totalHosts: Number(totalHosts?.count ?? 0),
    totalBookings: Number(totalBookings?.count ?? 0),
    pendingHosts: Number(pendingHosts?.count ?? 0),
    totalRevenueJpy: Number(totalRevenue?.total ?? 0),
    currentMonthRevenueJpy: Number(currentMonthRevenue?.total ?? 0),
    lastMonthRevenueJpy: Number(lastMonthRevenue?.total ?? 0),
    currentMonthUsers: Number(currentMonthUsers?.count ?? 0),
    lastMonthUsers: Number(lastMonthUsers?.count ?? 0),
  };
}

// ─── Experience Reviews ───────────────────────────────────────────────────────

export async function createExperienceReview(data: InsertExperienceReview) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(experienceReviews).values(data);
  return result;
}

export async function getExperienceReviews(experienceId: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(experienceReviews)
    .where(
      and(
        eq(experienceReviews.experienceId, experienceId),
        eq(experienceReviews.isPublished, true),
        eq(experienceReviews.isFlagged, false)
      )
    )
    .orderBy(desc(experienceReviews.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getCookingSchoolReviews(cookingSchoolId: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(experienceReviews)
    .where(
      and(
        eq(experienceReviews.cookingSchoolId, cookingSchoolId),
        eq(experienceReviews.isPublished, true),
        eq(experienceReviews.isFlagged, false)
      )
    )
    .orderBy(desc(experienceReviews.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getExperienceRatingSummary(experienceId: number) {
  const db = await getDb();
  if (!db) return { avgRating: 0, count: 0 };
  const [row] = await db
    .select({
      avgRating: sql<number>`ROUND(AVG(ratingOverall), 1)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(experienceReviews)
    .where(
      and(
        eq(experienceReviews.experienceId, experienceId),
        eq(experienceReviews.isPublished, true)
      )
    );
  return {
    avgRating: Number(row?.avgRating ?? 0),
    count: Number(row?.count ?? 0),
  };
}

export async function getCookingSchoolRatingSummary(cookingSchoolId: number) {
  const db = await getDb();
  if (!db) return { avgRating: 0, count: 0 };
  const [row] = await db
    .select({
      avgRating: sql<number>`ROUND(AVG(ratingOverall), 1)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(experienceReviews)
    .where(
      and(
        eq(experienceReviews.cookingSchoolId, cookingSchoolId),
        eq(experienceReviews.isPublished, true)
      )
    );
  return {
    avgRating: Number(row?.avgRating ?? 0),
    count: Number(row?.count ?? 0),
  };
}

export async function hasUserReviewedExperience(userId: number, experienceId: number) {
  const db = await getDb();
  if (!db) return false;
  const rows = await db
    .select({ id: experienceReviews.id })
    .from(experienceReviews)
    .where(
      and(
        eq(experienceReviews.authorId, userId),
        eq(experienceReviews.experienceId, experienceId)
      )
    )
    .limit(1);
  return rows.length > 0;
}

export async function hasUserReviewedCookingSchool(userId: number, cookingSchoolId: number) {
  const db = await getDb();
  if (!db) return false;
  const rows = await db
    .select({ id: experienceReviews.id })
    .from(experienceReviews)
    .where(
      and(
        eq(experienceReviews.authorId, userId),
        eq(experienceReviews.cookingSchoolId, cookingSchoolId)
      )
    )
    .limit(1);
  return rows.length > 0;
}

export async function getExperienceReviewById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [row] = await db.select().from(experienceReviews).where(eq(experienceReviews.id, id)).limit(1);
  return row;
}

export async function getExperienceReviewsByAuthorId(authorId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(experienceReviews)
    .where(eq(experienceReviews.authorId, authorId))
    .orderBy(desc(experienceReviews.createdAt));
}

export async function updateExperienceReview(id: number, data: Partial<typeof experienceReviews.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(experienceReviews).set(data).where(eq(experienceReviews.id, id));
}

export async function getExperienceReviewsByHostId(hostId: number) {
  const db = await getDb();
  if (!db) return [];
  // Get reviews for experiences owned by this host
  return db
    .select({
      id: experienceReviews.id,
      experienceId: experienceReviews.experienceId,
      cookingSchoolId: experienceReviews.cookingSchoolId,
      authorId: experienceReviews.authorId,
      authorName: experienceReviews.authorName,
      ratingOverall: experienceReviews.ratingOverall,
      ratingFood: experienceReviews.ratingFood,
      ratingHost: experienceReviews.ratingHost,
      ratingValue: experienceReviews.ratingValue,
      titleJa: experienceReviews.titleJa,
      titleEn: experienceReviews.titleEn,
      commentJa: experienceReviews.commentJa,
      commentEn: experienceReviews.commentEn,
      replyByHost: experienceReviews.replyByHost,
      repliedAt: experienceReviews.repliedAt,
      isPublished: experienceReviews.isPublished,
      isFlagged: experienceReviews.isFlagged,
      createdAt: experienceReviews.createdAt,
      updatedAt: experienceReviews.updatedAt,
    })
    .from(experienceReviews)
    .innerJoin(experiences, eq(experienceReviews.experienceId, experiences.id))
    .where(
      and(
        eq(experiences.hostId, hostId),
        eq(experienceReviews.isPublished, true),
        eq(experienceReviews.isFlagged, false)
      )
    )
    .orderBy(desc(experienceReviews.createdAt));
}

// ─── Host Availability (Calendar) ────────────────────────────────────────────
export async function getAvailabilityByHostId(hostId: number, fromDate?: string, toDate?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(hostAvailability.hostId, hostId)];
  if (fromDate) conditions.push(gte(hostAvailability.date, fromDate));
  if (toDate) conditions.push(lte(hostAvailability.date, toDate));
  return db
    .select()
    .from(hostAvailability)
    .where(and(...conditions))
    .orderBy(hostAvailability.date, hostAvailability.startTime);
}

export async function getAvailabilityByCookingSchoolId(cookingSchoolId: number, fromDate?: string, toDate?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(hostAvailability.cookingSchoolId, cookingSchoolId)];
  if (fromDate) conditions.push(gte(hostAvailability.date, fromDate));
  if (toDate) conditions.push(lte(hostAvailability.date, toDate));
  return db
    .select()
    .from(hostAvailability)
    .where(and(...conditions))
    .orderBy(hostAvailability.date, hostAvailability.startTime);
}

export async function getAvailableSlotsByHostId(hostId: number, fromDate: string, toDate: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(hostAvailability)
    .where(
      and(
        eq(hostAvailability.hostId, hostId),
        eq(hostAvailability.status, "available"),
        gte(hostAvailability.date, fromDate),
        lte(hostAvailability.date, toDate)
      )
    )
    .orderBy(hostAvailability.date, hostAvailability.startTime);
}

export async function createAvailabilitySlot(data: InsertHostAvailability) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(hostAvailability).values(data);
  return result;
}

export async function updateAvailabilitySlot(id: number, data: Partial<InsertHostAvailability>) {
  const db = await getDb();
  if (!db) return;
  await db.update(hostAvailability).set(data).where(eq(hostAvailability.id, id));
}

export async function deleteAvailabilitySlot(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(hostAvailability).where(eq(hostAvailability.id, id));
}

export async function getAvailabilitySlotById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(hostAvailability).where(eq(hostAvailability.id, id)).limit(1);
  return result[0];
}

// ─── Cooking School Owner Queries ─────────────────────────────────────────────
/** Get all bookings for a cooking school (via experiences -> hosts -> cookingSchool) */
export async function getBookingsByCookingSchoolId(cookingSchoolId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: bookings.id,
      guestId: bookings.guestId,
      experienceId: bookings.experienceId,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      adultsCount: bookings.adultsCount,
      childrenCount: bookings.childrenCount,
      amountJpy: bookings.amountJpy,
      hostPayoutJpy: bookings.hostPayoutJpy,
      currency: bookings.currency,
      status: bookings.status,
      dietaryRestrictions: bookings.dietaryRestrictions,
      specialRequests: bookings.specialRequests,
      createdAt: bookings.createdAt,
      completedAt: bookings.completedAt,
      experienceTitleJa: experiences.titleJa,
      experienceTitleEn: experiences.titleEn,
    })
    .from(bookings)
    .innerJoin(experiences, eq(bookings.experienceId, experiences.id))
    .innerJoin(hosts, eq(experiences.hostId, hosts.id))
    .where(eq(hosts.cookingSchoolId, cookingSchoolId))
    .orderBy(desc(bookings.createdAt));
}

/** Get ALL experiences (including pending/inactive) for a cooking school owner */
export async function getAllExperiencesByCookingSchoolId(cookingSchoolId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(experiences)
    .innerJoin(hosts, eq(experiences.hostId, hosts.id))
    .where(eq(hosts.cookingSchoolId, cookingSchoolId))
    .orderBy(desc(experiences.createdAt));
}

// ─── Reminder Scheduler Queries ───────────────────────────────────────────────
/**
 * Get confirmed bookings that need a reminder email sent.
 * reminderType determines which flag to check and the time window.
 */
export async function getBookingsNeedingReminder(
  reminderType: "10days" | "3days" | "1day" | "morning" | "3hours"
) {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  // Define time windows: send reminder when startTime is within the window
  const windows: Record<typeof reminderType, { minMs: number; maxMs: number }> = {
    "10days":  { minMs: 9 * 24 * 60 * 60 * 1000,  maxMs: 11 * 24 * 60 * 60 * 1000 },
    "3days":   { minMs: 2 * 24 * 60 * 60 * 1000,  maxMs: 4 * 24 * 60 * 60 * 1000 },
    "1day":    { minMs: 18 * 60 * 60 * 1000,       maxMs: 30 * 60 * 60 * 1000 },
    "morning": { minMs: 6 * 60 * 60 * 1000,        maxMs: 18 * 60 * 60 * 1000 },
    "3hours":  { minMs: 2 * 60 * 60 * 1000,        maxMs: 4 * 60 * 60 * 1000 },
  };

  const { minMs, maxMs } = windows[reminderType];
  const minTime = new Date(now.getTime() + minMs);
  const maxTime = new Date(now.getTime() + maxMs);

  // Map reminderType to the sent flag column
  const flagCol = {
    "10days":  bookings.reminder10DaySent,
    "3days":   bookings.reminder3DaySent,
    "1day":    bookings.reminder1DaySent,
    "morning": bookings.reminderDaySent,
    "3hours":  bookings.reminder3HourSent,
  }[reminderType];

  return db
    .select({
      id: bookings.id,
      guestId: bookings.guestId,
      hostId: bookings.hostId,
      experienceId: bookings.experienceId,
      startTime: bookings.startTime,
      pickupStation: bookings.pickupStation,
      experienceTitleJa: experiences.titleJa,
      experienceTitleEn: experiences.titleEn,
      guestEmail: users.email,
      guestName: users.name,
      guestPreferredLanguage: users.preferredLanguage,
      hostBioEn: hosts.bioEn,
      hostNearestStation: hosts.nearestStation,
    })
    .from(bookings)
    .innerJoin(experiences, eq(bookings.experienceId, experiences.id))
    .innerJoin(users, eq(bookings.guestId, users.id))
    .innerJoin(hosts, eq(bookings.hostId, hosts.id))
    .where(
      and(
        eq(bookings.status, "confirmed"),
        eq(flagCol, false),
        gte(bookings.startTime, minTime),
        lte(bookings.startTime, maxTime)
      )
    );
}

// ─── Guest Inquiries ──────────────────────────────────────────────────────────
export async function createGuestInquiry(data: InsertGuestInquiry) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(guestInquiries).values(data);
  return result;
}

export async function getGuestInquiryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(guestInquiries).where(eq(guestInquiries.id, id)).limit(1);
  return result[0];
}

export async function getGuestInquiriesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(guestInquiries).where(eq(guestInquiries.userId, userId)).orderBy(desc(guestInquiries.createdAt));
}

export async function getAllGuestInquiries(limit = 50, offset = 0, status?: GuestInquiry["status"]) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(guestInquiries);
  if (status) {
    return query.where(eq(guestInquiries.status, status)).limit(limit).offset(offset).orderBy(desc(guestInquiries.createdAt));
  }
  return query.limit(limit).offset(offset).orderBy(desc(guestInquiries.createdAt));
}

export async function updateGuestInquiry(id: number, data: Partial<InsertGuestInquiry>) {
  const db = await getDb();
  if (!db) return;
  await db.update(guestInquiries).set(data).where(eq(guestInquiries.id, id));
}

// ─── Booking Chats ────────────────────────────────────────────────────────────
export async function createBookingChat(data: InsertBookingChat) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(bookingChats).values(data);
  return result;
}

export async function getChatsByInquiryId(inquiryId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(bookingChats)
    .where(eq(bookingChats.inquiryId, inquiryId))
    .orderBy(bookingChats.createdAt);
}

export async function getChatsByBookingId(bookingId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(bookingChats)
    .where(eq(bookingChats.bookingId, bookingId))
    .orderBy(bookingChats.createdAt);
}

export async function markChatsReadByGuest(inquiryId?: number, bookingId?: number) {
  const db = await getDb();
  if (!db) return;
  if (inquiryId) {
    await db.update(bookingChats).set({ isReadByGuest: true }).where(eq(bookingChats.inquiryId, inquiryId));
  } else if (bookingId) {
    await db.update(bookingChats).set({ isReadByGuest: true }).where(eq(bookingChats.bookingId, bookingId));
  }
}

export async function markChatsReadByAdmin(inquiryId?: number, bookingId?: number) {
  const db = await getDb();
  if (!db) return;
  if (inquiryId) {
    await db.update(bookingChats).set({ isReadByAdmin: true }).where(eq(bookingChats.inquiryId, inquiryId));
  } else if (bookingId) {
    await db.update(bookingChats).set({ isReadByAdmin: true }).where(eq(bookingChats.bookingId, bookingId));
  }
}

export async function getUnreadChatCountForAdmin() {
  const db = await getDb();
  if (!db) return 0;
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(bookingChats)
    .where(eq(bookingChats.isReadByAdmin, false));
  return Number(row?.count ?? 0);
}

export async function getAllChatsForAdmin(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  // Get latest message per inquiry/booking
  return db
    .select()
    .from(bookingChats)
    .orderBy(desc(bookingChats.createdAt))
    .limit(limit);
}

// ─── Booking Chats: Guest unread count ───────────────────────────────────────
export async function getUnreadChatCountForGuest(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  // ゲストのguestInquiryId一覧を取得
  const myInquiries = await db
    .select({ id: guestInquiries.id })
    .from(guestInquiries)
    .where(eq(guestInquiries.userId, userId));
  if (myInquiries.length === 0) return 0;
  const inquiryIds = myInquiries.map((i) => i.id);
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(bookingChats)
    .where(
      and(
        eq(bookingChats.isReadByGuest, false),
        or(...inquiryIds.map((id) => eq(bookingChats.inquiryId, id)))
      )
    );
  return Number(row?.count ?? 0);
}

// ─── Booking Chats: Host unread count ────────────────────────────────────────
export async function getUnreadChatCountForHost(hostUserId: number) {
  const db = await getDb();
  if (!db) return 0;
  // ホストが担当しているguestInquiryのIDを取得
  const myInquiries = await db
    .select({ id: guestInquiries.id })
    .from(guestInquiries)
    .innerJoin(hosts, eq(guestInquiries.assignedHostId, hosts.id))
    .where(eq(hosts.userId, hostUserId));
  if (myInquiries.length === 0) return 0;
  const inquiryIds = myInquiries.map((i) => i.id);
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(bookingChats)
    .where(
      and(
        eq(bookingChats.isReadByAdmin, false),
        or(...inquiryIds.map((id) => eq(bookingChats.inquiryId, id)))
      )
    );
  return Number(row?.count ?? 0);
}

// ─── Booking Chats: Get threads for host ─────────────────────────────────────
export async function getHostChatThreads(hostUserId: number) {
  const db = await getDb();
  if (!db) return [];
  const myInquiries = await db
    .select({ id: guestInquiries.id, guestName: guestInquiries.preferredArea })
    .from(guestInquiries)
    .innerJoin(hosts, eq(guestInquiries.assignedHostId, hosts.id))
    .where(eq(hosts.userId, hostUserId));
  if (myInquiries.length === 0) return [];
  const inquiryIds = myInquiries.map((i) => i.id);
  return db
    .select()
    .from(bookingChats)
    .where(or(...inquiryIds.map((id) => eq(bookingChats.inquiryId, id))))
    .orderBy(desc(bookingChats.createdAt))
    .limit(200);
}

// ─── Booking Chats: Mark as read (per inquiry) ───────────────────────────────
export async function markChatsReadByAdminForInquiry(inquiryId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(bookingChats)
    .set({ isReadByAdmin: true })
    .where(eq(bookingChats.inquiryId, inquiryId));
}

export async function markChatsReadByGuestForInquiry(inquiryId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(bookingChats)
    .set({ isReadByGuest: true })
    .where(eq(bookingChats.inquiryId, inquiryId));
}

// ─── BtoB リード管理 ──────────────────────────────────────────────────────────

export async function createLead(data: InsertLead): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(leads).values(data);
  return (result[0] as { insertId: number }).insertId;
}

export async function getLeadById(id: number): Promise<Lead | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return rows[0];
}

export async function getAllLeads(filters?: {
  type?: "host" | "cooking_school" | "agent";
  status?: "new" | "contacted" | "qualified" | "converted" | "rejected";
}): Promise<Lead[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.type) conditions.push(eq(leads.type, filters.type));
  if (filters?.status) conditions.push(eq(leads.status, filters.status));
  return db
    .select()
    .from(leads)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(leads.createdAt));
}

export async function updateLead(
  id: number,
  data: Partial<Pick<Lead, "status" | "notes" | "repliedAt" | "accessToken">>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(leads).set(data).where(eq(leads.id, id));
}

export async function getLeadByToken(token: string): Promise<Lead | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(leads).where(eq(leads.accessToken, token)).limit(1);
  return rows[0];
}

export async function deleteLead(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(leads).where(eq(leads.id, id));
}

// ─── お問い合わせ（Contact Inquiries）────────────────────────────────────────
export async function createContactInquiry(data: InsertContactInquiry): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(contactInquiries).values(data);
  return (result[0] as { insertId: number }).insertId;
}

export async function getAllContactInquiries(filters?: {
  status?: "new" | "in_progress" | "resolved";
}): Promise<ContactInquiry[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.status) conditions.push(eq(contactInquiries.status, filters.status));
  return db
    .select()
    .from(contactInquiries)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(contactInquiries.createdAt));
}

export async function updateContactInquiry(
  id: number,
  data: Partial<Pick<ContactInquiry, "status" | "adminNote">>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(contactInquiries).set(data).where(eq(contactInquiries.id, id));
}

// ─── eKYC 申請（KYC Submissions）────────────────────────────────────────────
export async function createKycSubmission(data: InsertKycSubmission): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(kycSubmissions).values(data);
  return (result[0] as { insertId: number }).insertId;
}

export async function getKycSubmissionsByUserId(userId: number): Promise<KycSubmission[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(kycSubmissions)
    .where(eq(kycSubmissions.userId, userId))
    .orderBy(desc(kycSubmissions.submittedAt));
}

export async function getAllKycSubmissions(filters?: {
  status?: "pending" | "approved" | "rejected";
}): Promise<KycSubmission[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.status) conditions.push(eq(kycSubmissions.status, filters.status));
  return db
    .select()
    .from(kycSubmissions)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(kycSubmissions.submittedAt));
}

export async function updateKycSubmission(
  id: number,
  data: Partial<Pick<KycSubmission, "status" | "reviewNote" | "reviewedBy" | "reviewedAt" | "stripeVerificationSessionId" | "stripeVerificationStatus" | "stripeVerificationReportId">>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(kycSubmissions).set(data).where(eq(kycSubmissions.id, id));
}

export async function getKycSubmissionByStripeSessionId(sessionId: string): Promise<KycSubmission | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(kycSubmissions)
    .where(eq(kycSubmissions.stripeVerificationSessionId, sessionId))
    .limit(1);
  return result[0];
}
