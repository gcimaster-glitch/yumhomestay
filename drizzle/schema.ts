import {
  bigint,
  boolean,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ───────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // Extended fields for YHS
  userType: mysqlEnum("userType", ["guest", "host", "agent", "admin"]).default("guest").notNull(),
  preferredLanguage: varchar("preferredLanguage", { length: 10 }).default("en"),
  // eKYC / identity
  identityStatus: mysqlEnum("identityStatus", ["unverified", "pending", "verified", "failed"]).default("unverified").notNull(),
  passportInfoEncrypted: text("passportInfoEncrypted"), // AES encrypted JSON
  emergencyContactEncrypted: text("emergencyContactEncrypted"), // AES encrypted
  // MFA
  mfaEnabled: boolean("mfaEnabled").default(false).notNull(),
  mfaSecret: text("mfaSecret"), // TOTP secret (encrypted)
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"), // soft delete
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Hosts ───────────────────────────────────────────────────────────────────
// ─── Cooking Schools ─────────────────────────────────────────────────────────────────────────────
export const cookingSchools = mysqlTable("cookingSchools", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // FK → users.id (owner account)
  // Business info
  nameJa: varchar("nameJa", { length: 255 }).notNull(),
  nameEn: varchar("nameEn", { length: 255 }),
  descriptionJa: text("descriptionJa"),
  descriptionEn: text("descriptionEn"),
  // Contact
  websiteUrl: varchar("websiteUrl", { length: 500 }),
  phoneNumber: varchar("phoneNumber", { length: 30 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  // Location
  addressEncrypted: text("addressEncrypted"), // AES encrypted full address
  prefecture: varchar("prefecture", { length: 100 }),
  city: varchar("city", { length: 100 }),
  nearestStation: varchar("nearestStation", { length: 255 }),
  googleMapsUrl: varchar("googleMapsUrl", { length: 500 }),
  // Capacity & facilities
  maxCapacity: int("maxCapacity").default(20),
  hasKitchenEquipment: boolean("hasKitchenEquipment").default(true),
  hasWheelchairAccess: boolean("hasWheelchairAccess").default(false),
  hasHalalKitchen: boolean("hasHalalKitchen").default(false),
  // Languages spoken
  languages: text("languages"), // JSON: ["ja","en","zh"]
  // Certifications / licenses
  businessLicenseNumber: varchar("businessLicenseNumber", { length: 100 }),
  certifications: text("certifications"), // JSON: ["JCBA","ISO22000"]
  // Stripe Connect
  stripeAccountId: varchar("stripeAccountId", { length: 255 }),
  stripeAccountStatus: mysqlEnum("stripeAccountStatus", ["pending","active","restricted"]).default("pending"),
  // Cuisine & capacity
  cuisineSpecialty: varchar("cuisineSpecialty", { length: 100 }),
  maxStudents: int("maxStudents").default(10),
  pricePerPersonJpy: int("pricePerPersonJpy"),
  averageRating: decimal("averageRating", { precision: 3, scale: 2 }),
  // Images
  profileImageUrl: text("profileImageUrl"),
  galleryImageUrls: text("galleryImageUrls"), // JSON array
  imageUrls: text("imageUrls"), // JSON array (alias for frontend)
  // Status
  approvalStatus: mysqlEnum("approvalStatus", ["pending","interview","approved","rejected","suspended"]).default("pending").notNull(),
  approvedAt: timestamp("approvedAt"),
  approvedBy: int("approvedBy"),
  isActive: boolean("isActive").default(false).notNull(),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CookingSchool = typeof cookingSchools.$inferSelect;

// ─── Hosts ───────────────────────────────────────────────────────────────────────────────
export const hosts = mysqlTable("hosts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // FK → users.id
  // Host type: individual home host or cooking school
  hostType: mysqlEnum("hostType", ["individual", "cooking_school"]).default("individual").notNull(),
  cookingSchoolId: int("cookingSchoolId"), // FK → cookingSchools.id (if hostType=cooking_school)
  // KYC
  kycStatus: mysqlEnum("kycStatus", ["unverified", "pending", "verified", "failed"]).default("unverified").notNull(),
  stripeIdentitySessionId: varchar("stripeIdentitySessionId", { length: 255 }),
  // Stripe Connect
  stripeAccountId: varchar("stripeAccountId", { length: 255 }),
  stripeAccountStatus: mysqlEnum("stripeAccountStatus", ["pending", "active", "restricted"]).default("pending"),
  // Profile
  bio: text("bio"),
  bioJa: text("bioJa"),
  bioEn: text("bioEn"),
  addressEncrypted: text("addressEncrypted"), // AES encrypted
  nearestStation: varchar("nearestStation", { length: 255 }),
  prefecture: varchar("prefecture", { length: 100 }),
  city: varchar("city", { length: 100 }),
  languages: text("languages"), // JSON array: ["ja","en","zh"]
  profileImageUrl: text("profileImageUrl"),
  // YHS Host Requirements (spec-compliant)
  familyMemberCount: int("familyMemberCount").default(2), // min 2 required
  canCookTogether: boolean("canCookTogether").default(true), // must cook together
  hasSpecialCertification: boolean("hasSpecialCertification").default(false), // culture cert
  certificationDetails: text("certificationDetails"), // cert description
  hasInsurance: boolean("hasInsurance").default(false), // liability insurance required
  registrationFeePaid: boolean("registrationFeePaid").default(false), // 登録料・研修手数料。5000円
  trainingCompleted: boolean("trainingCompleted").default(false), // 講習会・テスト合格
  certificationIssuedAt: timestamp("certificationIssuedAt"), // 認定書発行日
  interviewScheduledAt: timestamp("interviewScheduledAt"), // ZOOM面談予定日
  interviewCompletedAt: timestamp("interviewCompletedAt"), // ZOOM面談完了日
  minSessionHours: int("minSessionHours").default(3), // min 3 hours
  maxSessionHours: int("maxSessionHours").default(5), // max 5 hours
  dietaryAccommodations: text("dietaryAccommodations"), // JSON: ["halal","vegan",...]
  // Status
  approvalStatus: mysqlEnum("approvalStatus", ["pending", "interview", "approved", "rejected", "suspended"]).default("pending").notNull(),
  approvedAt: timestamp("approvedAt"),
  approvedBy: int("approvedBy"), // FK → users.id (admin)
  isActive: boolean("isActive").default(false).notNull(),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Host = typeof hosts.$inferSelect;

// ─── Experiences ─────────────────────────────────────────────────────────────
export const experiences = mysqlTable("experiences", {
  id: int("id").autoincrement().primaryKey(),
  hostId: int("hostId").notNull(), // FK → hosts.id
  // Multilingual content
  titleJa: varchar("titleJa", { length: 255 }),
  titleEn: varchar("titleEn", { length: 255 }).notNull(),
  descriptionJa: text("descriptionJa"),
  descriptionEn: text("descriptionEn").notNull(),
  // Pricing
  priceJpy: int("priceJpy").notNull(), // base price in JPY
  // Details
  durationMinutes: int("durationMinutes").default(180).notNull(),
  maxGuests: int("maxGuests").default(6).notNull(),
  minGuests: int("minGuests").default(1).notNull(),
  // Tags / filters
  cuisineType: varchar("cuisineType", { length: 100 }), // e.g. "japanese","vegetarian"
  dietaryOptions: text("dietaryOptions"), // JSON: ["halal","vegan","vegetarian"]
  experienceType: mysqlEnum("experienceType", ["cooking", "culture", "both"]).default("cooking"),
  // Cancellation
  cancellationPolicy: mysqlEnum("cancellationPolicy", ["flexible", "moderate", "strict"]).default("moderate"),
  // Status
  approvalStatus: mysqlEnum("approvalStatus", ["pending", "approved", "rejected"]).default("pending").notNull(),
  isActive: boolean("isActive").default(false).notNull(),
  // Images
  imageUrls: text("imageUrls"), // JSON array of CDN URLs
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Experience = typeof experiences.$inferSelect;

// ─── Bookings ─────────────────────────────────────────────────────────────────
export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  guestId: int("guestId").notNull(), // FK → users.id
  hostId: int("hostId").notNull(), // FK → hosts.id
  experienceId: int("experienceId").notNull(), // FK → experiences.id
  agentId: int("agentId"), // FK → agents.id (nullable)
  // Schedule
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  // Participants (YHS spec: base 2 adults, children 5+, infants under 5)
  adultsCount: int("adultsCount").default(2).notNull(), // base 2 adults
  childrenCount: int("childrenCount").default(0).notNull(), // children 5+
  infantsCount: int("infantsCount").default(0), // infants under 5
  // Pricing (YHS fixed pricing — shared/pricing.ts)
  basePriceJpy: int("basePriceJpy").default(55000), // base: 2 adults, 4h = ¥55,000
  extraAdultPriceJpy: int("extraAdultPriceJpy").default(0), // extra adult × ¥22,000
  extraChildPriceJpy: int("extraChildPriceJpy").default(0), // extra child × ¥11,000
  extraInfantPriceJpy: int("extraInfantPriceJpy").default(0), // extra infant × ¥5,500
  amountTotal: int("amountTotal").notNull(), // in guest currency (minor units)
  currency: varchar("currency", { length: 3 }).default("JPY").notNull(),
  exchangeRateToJpy: decimal("exchangeRateToJpy", { precision: 18, scale: 6 }).default("1.000000"),
  amountJpy: int("amountJpy").notNull(), // converted to JPY (= total sales)
  serviceFeeJpy: int("serviceFeeJpy").notNull(), // agent + card + affiliate fees
  hostPayoutJpy: int("hostPayoutJpy").notNull(), // host reward + food cost = ¥25,000
  agentFeeJpy: int("agentFeeJpy").default(0), // agent commission ¥8,800
  agentBonusFeeJpy: int("agentBonusFeeJpy").default(0), // agent monthly bonus
  cardFeeJpy: int("cardFeeJpy").default(0), // card processing fee (5% of sales)
  affiliateFeeJpy: int("affiliateFeeJpy").default(0), // affiliate commission ¥2,200
  platformProfitJpy: int("platformProfitJpy").default(0), // YHS net profit
  // Pickup / meeting
  pickupStation: varchar("pickupStation", { length: 255 }), // nearest station for pickup
  meetingTime: timestamp("meetingTime"), // pickup time at station
  // Dietary / special requests
  dietaryRestrictions: text("dietaryRestrictions"),
  specialRequests: text("specialRequests"),
  // Status
  status: mysqlEnum("status", [
    "pending",
    "pending_payment",
    "confirmed",
    "completed",
    "cancelled_by_guest",
    "cancelled_by_host",
    "cancelled_by_admin",
  ]).default("pending").notNull(),
  confirmedAt: timestamp("confirmedAt"),
  completedAt: timestamp("completedAt"),
  cancelledAt: timestamp("cancelledAt"),
  cancellationReason: text("cancellationReason"),
  // Reminders sent flags (10d / 3d / 1d / day-of / 3h before)
  reminder10DaySent: boolean("reminder10DaySent").default(false),
  reminder3DaySent: boolean("reminder3DaySent").default(false),
  reminder1DaySent: boolean("reminder1DaySent").default(false),
  reminderDaySent: boolean("reminderDaySent").default(false),
  reminder3HourSent: boolean("reminder3HourSent").default(false), // 3h before service
  // Video Call (required before visit - 10 min pre-visit call)
  videoCallRequired: boolean("videoCallRequired").default(true).notNull(),
  videoCallScheduledAt: timestamp("videoCallScheduledAt"),
  videoCallCompletedAt: timestamp("videoCallCompletedAt"),
  videoCallNotes: text("videoCallNotes"),
  // Guest Survey (post-completion)
  guestSurveyRating: int("guestSurveyRating"), // 1-5 stars
  guestSurveyComment: text("guestSurveyComment"),
  guestSurveySubmittedAt: timestamp("guestSurveySubmittedAt"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;

// ─── Payments ─────────────────────────────────────────────────────────────────
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull().unique(), // FK → bookings.id
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }).unique(),
  stripeSessionId: varchar("stripeSessionId", { length: 255 }),
  stripeChargeId: varchar("stripeChargeId", { length: 255 }),
  amount: int("amount").notNull(), // in guest currency minor units
  currency: varchar("currency", { length: 3 }).notNull(),
  amountJpy: int("amountJpy").notNull(),
  status: mysqlEnum("status", [
    "requires_payment_method",
    "requires_confirmation",
    "processing",
    "succeeded",
    "failed",
    "refunded",
  ]).default("requires_payment_method").notNull(),
  refundedAt: timestamp("refundedAt"),
  refundReason: text("refundReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;

// ─── Payouts ──────────────────────────────────────────────────────────────────
export const payouts = mysqlTable("payouts", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(), // FK → bookings.id
  recipientId: int("recipientId").notNull(), // FK → users.id (host or agent)
  recipientType: mysqlEnum("recipientType", ["host", "agent"]).notNull(),
  stripeTransferId: varchar("stripeTransferId", { length: 255 }),
  amountJpy: int("amountJpy").notNull(),
  status: mysqlEnum("status", ["pending", "processing", "paid", "failed"]).default("pending").notNull(),
  scheduledDate: timestamp("scheduledDate"), // end-of-month
  paidAt: timestamp("paidAt"),
  failureReason: text("failureReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payout = typeof payouts.$inferSelect;

// ─── Reviews ──────────────────────────────────────────────────────────────────
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(), // FK → bookings.id
  authorId: int("authorId").notNull(), // FK → users.id
  recipientId: int("recipientId").notNull(), // FK → users.id
  authorType: mysqlEnum("authorType", ["guest", "host"]).notNull(),
  // Ratings
  ratingOverall: int("ratingOverall").notNull(), // 1-5
  ratingCleanliness: int("ratingCleanliness"), // 1-5
  ratingAccuracy: int("ratingAccuracy"), // 1-5
  ratingCommunication: int("ratingCommunication"), // 1-5
  // Content
  commentPublic: text("commentPublic"),
  commentPrivate: text("commentPrivate"), // only visible to recipient
  // Blind review: both sides must submit before either is shown
  isBlind: boolean("isBlind").default(true).notNull(),
  isPublished: boolean("isPublished").default(false).notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;

// ─── Messages ─────────────────────────────────────────────────────────────────
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(), // FK → bookings.id
  senderId: int("senderId").notNull(), // FK → users.id
  receiverId: int("receiverId").notNull(), // FK → users.id
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  isFlagged: boolean("isFlagged").default(false), // flagged for moderation
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Message = typeof messages.$inferSelect;

// ─── Trouble Reports ──────────────────────────────────────────────────────────
export const troubleReports = mysqlTable("troubleReports", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId"), // FK → bookings.id (nullable)
  reporterId: int("reporterId").notNull(), // FK → users.id
  reportedUserId: int("reportedUserId"), // FK → users.id (nullable)
  category: mysqlEnum("category", ["no_show", "safety", "fraud", "quality", "other"]).notNull(),
  description: text("description").notNull(),
  status: mysqlEnum("status", ["open", "investigating", "resolved", "closed"]).default("open").notNull(),
  resolvedBy: int("resolvedBy"), // FK → users.id (admin)
  resolvedAt: timestamp("resolvedAt"),
  resolution: text("resolution"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Agents ───────────────────────────────────────────────────────────────────
export const agents = mysqlTable("agents", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameEn: varchar("nameEn", { length: 255 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  commissionRate: decimal("commissionRate", { precision: 5, scale: 4 }).default("0.1000"), // 10%
  stripeAccountId: varchar("stripeAccountId", { length: 255 }),
  status: mysqlEnum("status", ["active", "suspended"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Agent = typeof agents.$inferSelect;

// ─── Agent Members ────────────────────────────────────────────────────────────
export const agentMembers = mysqlTable("agentMembers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // FK → users.id
  agentId: int("agentId").notNull(), // FK → agents.id
  role: mysqlEnum("role", ["owner", "staff"]).default("staff").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Exchange Rates ───────────────────────────────────────────────────────────
export const exchangeRates = mysqlTable("exchangeRates", {
  id: int("id").autoincrement().primaryKey(),
  currency: varchar("currency", { length: 3 }).notNull(),
  rateToJpy: decimal("rateToJpy", { precision: 18, scale: 6 }).notNull(),
  fetchedAt: timestamp("fetchedAt").defaultNow().notNull(),
});

// ─── Coupons ──────────────────────────────────────────────────────────────────
export const coupons = mysqlTable("coupons", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  discountType: mysqlEnum("discountType", ["percentage", "fixed_jpy"]).notNull(),
  discountValue: int("discountValue").notNull(),
  maxUses: int("maxUses"),
  usedCount: int("usedCount").default(0).notNull(),
  expiresAt: timestamp("expiresAt"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Audit Logs (J-SOX) ───────────────────────────────────────────────────────
export const auditLogs = mysqlTable("auditLogs", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  userId: int("userId"), // FK → users.id (nullable for system actions)
  impersonatorId: int("impersonatorId"), // FK → users.id (if admin impersonating)
  action: varchar("action", { length: 100 }).notNull(), // e.g. "user.login", "booking.cancel"
  targetResource: varchar("targetResource", { length: 100 }), // e.g. "bookings"
  targetId: varchar("targetId", { length: 64 }), // resource ID
  payload: text("payload"), // JSON details
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;

// ─── Notifications ────────────────────────────────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // FK → users.id
  type: varchar("type", { length: 100 }).notNull(), // e.g. "booking_confirmed"
  titleJa: varchar("titleJa", { length: 255 }),
  titleEn: varchar("titleEn", { length: 255 }),
  bodyJa: text("bodyJa"),
  bodyEn: text("bodyEn"),
  isRead: boolean("isRead").default(false).notNull(),
  relatedBookingId: int("relatedBookingId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Experience Reviews (public, direct) ─────────────────────────────────────
// 体験・料理教室に対するゲストの公開口コミ（予約完了後に投稿可能）
export const experienceReviews = mysqlTable("experienceReviews", {
  id: int("id").autoincrement().primaryKey(),
  // Target: either experienceId or cookingSchoolId (one must be set)
  experienceId: int("experienceId"), // FK → experiences.id (nullable)
  cookingSchoolId: int("cookingSchoolId"), // FK → cookingSchools.id (nullable)
  // Author
  authorId: int("authorId").notNull(), // FK → users.id
  authorName: varchar("authorName", { length: 255 }), // cached display name
  // Ratings (1-5)
  ratingOverall: int("ratingOverall").notNull(), // overall star rating
  ratingFood: int("ratingFood"), // food quality
  ratingHost: int("ratingHost"), // host hospitality
  ratingValue: int("ratingValue"), // value for money
  // Content
  titleJa: varchar("titleJa", { length: 255 }),
  titleEn: varchar("titleEn", { length: 255 }),
  commentJa: text("commentJa"),
  commentEn: text("commentEn"),
  // Host reply
  replyByHost: text("replyByHost"),
  repliedAt: timestamp("repliedAt"),
  // Moderation
  isPublished: boolean("isPublished").default(true).notNull(),
  isFlagged: boolean("isFlagged").default(false).notNull(),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExperienceReview = typeof experienceReviews.$inferSelect;
export type InsertExperienceReview = typeof experienceReviews.$inferInsert;

// ─── Host Availability (Calendar) ────────────────────────────────────────────
// ホスト・料理教室の空き日程管理テーブル
export const hostAvailability = mysqlTable("hostAvailability", {
  id: int("id").autoincrement().primaryKey(),
  // Owner: either hostId or cookingSchoolId (one must be set)
  hostId: int("hostId"), // FK → hosts.id (nullable)
  cookingSchoolId: int("cookingSchoolId"), // FK → cookingSchools.id (nullable)
  // Date & time slot
  date: varchar("date", { length: 10 }).notNull(), // "YYYY-MM-DD"
  startTime: varchar("startTime", { length: 5 }).notNull(), // "HH:MM" (JST)
  endTime: varchar("endTime", { length: 5 }).notNull(), // "HH:MM" (JST)
  // Capacity for this slot
  maxGuests: int("maxGuests").default(6).notNull(),
  // Status
  status: mysqlEnum("status", ["available", "booked", "blocked"]).default("available").notNull(),
  // If booked, reference to booking
  bookingId: int("bookingId"), // FK → bookings.id (nullable)
  // Note (e.g. "Family event - unavailable")
  note: varchar("note", { length: 500 }),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HostAvailability = typeof hostAvailability.$inferSelect;
export type InsertHostAvailability = typeof hostAvailability.$inferInsert;

// ─── Host Registration Payments ──────────────────────────────────────────────
// ホスト登録料（¥5,000）のStripe決済記録
export const hostRegistrationPayments = mysqlTable("hostRegistrationPayments", {
  id: int("id").autoincrement().primaryKey(),
  hostId: int("hostId").notNull().unique(), // FK → hosts.id
  stripeSessionId: varchar("stripeSessionId", { length: 255 }).unique(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }).unique(),
  amountJpy: int("amountJpy").default(5000).notNull(),
  status: mysqlEnum("status", ["pending", "succeeded", "failed", "expired"]).default("pending").notNull(),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HostRegistrationPayment = typeof hostRegistrationPayments.$inferSelect;
export type InsertHostRegistrationPayment = typeof hostRegistrationPayments.$inferInsert;

// ─── Guest Inquiries ─────────────────────────────────────────────────────────
// ゲスト申込フロー（担当者確認フロー）管理テーブル
// フロー: submitted → reviewing → host_contacted → confirmed → payment_sent → completed / rejected / cancelled
export const guestInquiries = mysqlTable("guestInquiries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // FK → users.id (申込ゲスト)
  // 申込内容
  adultsCount: int("adultsCount").notNull().default(2),
  childrenCount: int("childrenCount").notNull().default(0),
  infantsCount: int("infantsCount").notNull().default(0),
  preferredHostId: int("preferredHostId"), // FK → hosts.id (ゲストが希望するホスト)
  preferredArea: varchar("preferredArea", { length: 255 }), // 希望エリア
  preferredDateFrom: varchar("preferredDateFrom", { length: 20 }), // 希望日程（from）
  preferredDateTo: varchar("preferredDateTo", { length: 20 }), // 希望日程（to）
  originCountry: varchar("originCountry", { length: 100 }), // 出身国
  languages: varchar("languages", { length: 500 }), // 対応希望言語（JSON配列）
  dietaryRestrictions: text("dietaryRestrictions"), // 食事制限・アレルギー
  specialRequests: text("specialRequests"), // その他ご要望
  // マッチング情報
  assignedHostId: int("assignedHostId"), // FK → hosts.id (マッチングされたホスト)
  assignedExperienceId: int("assignedExperienceId"), // FK → experiences.id
  assignedBookingId: int("assignedBookingId"), // FK → bookings.id (確定後)
  // 担当者情報
  assignedStaffName: varchar("assignedStaffName", { length: 255 }), // 担当スタッフ名
  staffNotes: text("staffNotes"), // スタッフ内部メモ
  // 請求リンク
  paymentLinkUrl: text("paymentLinkUrl"), // Stripe Payment Link or Checkout URL
  paymentLinkSentAt: timestamp("paymentLinkSentAt"), // 請求リンク送信日時
  // ステータス管理
  status: mysqlEnum("status", [
    "submitted",       // 申込受付
    "reviewing",       // 担当者確認中
    "host_contacted",  // ホスト候補に連絡済み
    "confirmed",       // マッチング確定・ゲストへ通知済み
    "payment_sent",    // 請求リンク送信済み
    "payment_received",// 入金確認済み
    "completed",       // サービス完了
    "rejected",        // 申込却下
    "cancelled",       // キャンセル
  ]).default("submitted").notNull(),
  rejectionReason: text("rejectionReason"), // 却下理由
  // ビデオ面談（ホームステイのみ・確定後に管理者が設定）
  videoCallScheduledAt: timestamp("videoCallScheduledAt"),   // 面談日時
  videoCallMeetingUrl: text("videoCallMeetingUrl"),           // Zoom URL等
  videoCallNotes: text("videoCallNotes"),                     // 面談メモ
  // タイムスタンプ
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt"),
  hostContactedAt: timestamp("hostContactedAt"),
  confirmedAt: timestamp("confirmedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type GuestInquiry = typeof guestInquiries.$inferSelect;
export type InsertGuestInquiry = typeof guestInquiries.$inferInsert;

// ─── Booking Chats (AI + Human) ──────────────────────────────────────────────
// 申込確定〜体験完了の間のみ利用可能なチャット（ホームステイ・料理教室共通）
export const bookingChats = mysqlTable("bookingChats", {
  id: int("id").autoincrement().primaryKey(),
  // 紐付け先（guestInquiryまたはbookingのどちらか）
  inquiryId: int("inquiryId"), // FK → guestInquiries.id (nullable)
  bookingId: int("bookingId"), // FK → bookings.id (nullable)
  // 送信者情報
  senderId: int("senderId"), // FK → users.id (null = AI)
  senderRole: mysqlEnum("senderRole", ["guest", "host", "admin", "ai"]).notNull(),
  // メッセージ内容
  content: text("content").notNull(),
  // AI応答メタデータ
  isAiGenerated: boolean("isAiGenerated").default(false).notNull(),
  aiModel: varchar("aiModel", { length: 100 }), // e.g. "gpt-4o"
  // 既読管理
  isReadByGuest: boolean("isReadByGuest").default(false).notNull(),
  isReadByAdmin: boolean("isReadByAdmin").default(false).notNull(),
  // タイムスタンプ
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type BookingChat = typeof bookingChats.$inferSelect;
export type InsertBookingChat = typeof bookingChats.$inferInsert;

// ─── Email Verification Tokens ───────────────────────────────────────────────
// メールアドレス変更確認トークン（変更リクエスト時に発行し、リンククリックで確定）
export const emailVerificationTokens = mysqlTable("emailVerificationTokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),          // FK → users.id
  newEmail: varchar("newEmail", { length: 255 }).notNull(), // 変更先メールアドレス
  token: varchar("token", { length: 128 }).notNull().unique(), // ランダムトークン
  expiresAt: timestamp("expiresAt").notNull(), // 有効期限（24時間）
  usedAt: timestamp("usedAt"),              // 使用済み日時（null = 未使用）
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;
export type InsertEmailVerificationToken = typeof emailVerificationTokens.$inferInsert;

// ─── BtoB リード管理 ──────────────────────────────────────────────────────────
// ホストファミリー・料理教室・旅行代理店向けLPからの資料請求・デモ申込みリード
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  // リードタイプ
  type: mysqlEnum("type", ["host", "cooking_school", "agent"]).notNull(),
  // 基本情報
  name: varchar("name", { length: 100 }).notNull(),
  company: varchar("company", { length: 200 }),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  // ホスト・料理教室向けフィールド
  prefecture: varchar("prefecture", { length: 50 }),       // 都道府県
  nearestStation: varchar("nearestStation", { length: 100 }), // 最寄り駅
  maxGuests: int("maxGuests"),                              // 最大受入人数
  // 旅行代理店向けフィールド
  agentRegion: mysqlEnum("agentRegion", ["domestic", "international", "both"]), // 国内/海外/両方
  agentCountry: varchar("agentCountry", { length: 100 }),  // 主要取扱国
  agentState: varchar("agentState", { length: 100 }),      // 州・地域
  specialtyRace: varchar("specialtyRace", { length: 200 }), // 得意な人種・国籍
  // アンケート（共通）
  q1Answer: varchar("q1Answer", { length: 500 }),          // Q1: 事業参入意欲・時期
  q2Answer: varchar("q2Answer", { length: 500 }),          // Q2: 現在の課題・期待
  // リード管理
  status: mysqlEnum("status", ["new", "contacted", "qualified", "converted", "rejected"]).default("new").notNull(),
  notes: text("notes"),                                    // 担当者メモ
  repliedAt: timestamp("repliedAt"),                       // 最終返信日時
  accessToken: varchar("accessToken", { length: 64 }),     // ビジネスモデルページアクセストークン
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// ─── お問い合わせ（Contact Inquiries）────────────────────────────────────────
// Contact.tsxからの問い合わせをDBに保存（管理者が後から確認できるように）
export const contactInquiries = mysqlTable("contactInquiries", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  inquiryType: varchar("inquiryType", { length: 50 }).notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["new", "in_progress", "resolved"]).default("new").notNull(),
  adminNote: text("adminNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ContactInquiry = typeof contactInquiries.$inferSelect;
export type InsertContactInquiry = typeof contactInquiries.$inferInsert;

// ─── eKYC 申請（KYC Submissions）────────────────────────────────────────────
// ユーザーが本人確認書類を提出し、管理者が審査する
export const kycSubmissions = mysqlTable("kycSubmissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),            // FK → users.id
  documentType: mysqlEnum("documentType", ["passport", "drivers_license", "residence_card", "stripe_identity"]).notNull(),
  documentFrontUrl: text("documentFrontUrl"),  // S3 URL（表面、手動提出時）
  documentBackUrl: text("documentBackUrl"),    // S3 URL（裏面、任意）
  selfieUrl: text("selfieUrl"),                // S3 URL（自撃り、任意）
  // Stripe Identity
  stripeVerificationSessionId: varchar("stripeVerificationSessionId", { length: 255 }), // vs_xxx
  stripeVerificationStatus: varchar("stripeVerificationStatus", { length: 64 }),        // verified / requires_input / processing / canceled
  stripeVerificationReportId: varchar("stripeVerificationReportId", { length: 255 }),   // vr_xxx
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  reviewedBy: int("reviewedBy"),              // FK → users.id (admin)
  reviewNote: text("reviewNote"),             // 審査コメント
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt"),
});
export type KycSubmission = typeof kycSubmissions.$inferSelect;
export type InsertKycSubmission = typeof kycSubmissions.$inferInsert;
