/**
 * YumHomeStay Reminder Email Scheduler
 *
 * Runs every 30 minutes to check for bookings needing reminder emails.
 * Sends reminders at: 10 days / 3 days / 1 day / morning-of / 3 hours before.
 *
 * Each reminder type is idempotent: the reminder*Sent flag prevents duplicates.
 */

import { getBookingsNeedingReminder, updateBooking } from "./db";
import { sendReminderEmail } from "./email";

type ReminderType = "10days" | "3days" | "1day" | "morning" | "3hours";

const REMINDER_FLAG_MAP: Record<ReminderType, keyof {
  reminder10DaySent: boolean;
  reminder3DaySent: boolean;
  reminder1DaySent: boolean;
  reminderDaySent: boolean;
  reminder3HourSent: boolean;
}> = {
  "10days":  "reminder10DaySent",
  "3days":   "reminder3DaySent",
  "1day":    "reminder1DaySent",
  "morning": "reminderDaySent",
  "3hours":  "reminder3HourSent",
};

async function processReminderType(reminderType: ReminderType) {
  const bookingsToRemind = await getBookingsNeedingReminder(reminderType);

  if (bookingsToRemind.length === 0) return;

  console.log(`[Reminder] Processing ${bookingsToRemind.length} bookings for ${reminderType} reminder`);

  for (const booking of bookingsToRemind) {
    try {
      if (!booking.guestEmail) {
        console.warn(`[Reminder] Booking #${booking.id}: no guest email, skipping`);
        continue;
      }

      const guestLang = booking.guestPreferredLanguage ?? "ja";
      const isJa = guestLang.startsWith("ja");
      const meetingPoint = booking.pickupStation
        ? isJa
          ? `${booking.pickupStation}（最寄り駅）`
          : `${booking.pickupStation} (nearest station)`
        : booking.hostNearestStation
          ? isJa
            ? `${booking.hostNearestStation}（最寄り駅）`
            : `${booking.hostNearestStation} (nearest station)`
          : isJa ? "ホストより当日ご連絡" : "Host will contact you on the day";

      const sent = await sendReminderEmail({
        to: booking.guestEmail,
        guestName: booking.guestName ?? "ゲスト",
        bookingId: booking.id,
        experienceTitle: booking.experienceTitleJa ?? booking.experienceTitleEn ?? "YumHomeStay体験",
        hostName: "YHSホスト",
        startTime: new Date(booking.startTime),
        meetingPoint,
        reminderType,
        lang: guestLang,
      });

      if (sent) {
        // Mark the flag so we don't send again
        const flagKey = REMINDER_FLAG_MAP[reminderType];
        await updateBooking(booking.id, { [flagKey]: true });
        console.log(`[Reminder] Sent ${reminderType} reminder for booking #${booking.id} to ${booking.guestEmail}`);
      } else {
        console.error(`[Reminder] Failed to send ${reminderType} reminder for booking #${booking.id}`);
      }
    } catch (err) {
      console.error(`[Reminder] Error processing booking #${booking.id}:`, err);
    }
  }
}

/**
 * Main scheduler function — call this on a cron schedule (e.g., every 30 minutes).
 * Checks all 5 reminder types in sequence.
 */
export async function runReminderJob() {
  console.log(`[Reminder] Job started at ${new Date().toISOString()}`);

  const reminderTypes: ReminderType[] = ["10days", "3days", "1day", "morning", "3hours"];

  for (const reminderType of reminderTypes) {
    try {
      await processReminderType(reminderType);
    } catch (err) {
      console.error(`[Reminder] Error in ${reminderType} batch:`, err);
    }
  }

  console.log(`[Reminder] Job completed at ${new Date().toISOString()}`);
}

/**
 * Start the reminder scheduler with setInterval.
 * Runs every 30 minutes.
 */
export function startReminderScheduler() {
  const INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

  // Run immediately on startup (with a short delay to let DB connect)
  setTimeout(() => {
    runReminderJob().catch((err) => console.error("[Reminder] Startup run failed:", err));
  }, 10_000);

  // Then run every 30 minutes
  const interval = setInterval(() => {
    runReminderJob().catch((err) => console.error("[Reminder] Scheduled run failed:", err));
  }, INTERVAL_MS);

  console.log("[Reminder] Scheduler started — running every 30 minutes");

  return interval;
}
