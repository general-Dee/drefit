import { lagosDateKey, lagosDayDiff, lagosHour } from "@/lib/lagos-time"
import type { ReminderType } from "./config"

export const DEFAULT_REMINDER_HOUR = 7

export interface ReminderUser {
  $id: string
  name?: string
  phone?: string | null
  whatsappOptIn?: boolean | null
  reminderHour?: number | null
  subscriptionStatus?: string
  trialEndsAt?: string | null
  subscriptionCurrentPeriodEnd?: string | null
}

export interface PlannedReminder {
  type: ReminderType
  // Dedupe key component; payment reminders include the days-left value.
  dedupeType: string
  day: string
  params: string[]
}

export type ScheduleMode = "hourly" | "daily"

export function firstName(name?: string): string {
  return (name ?? "").trim().split(/\s+/)[0] || "there"
}

// Pure: which reminders are due for this user at `now`.
// - hourly mode: only when the Lagos hour equals the user's chosen hour.
// - daily mode (one cron run per day): everything due today.
export function planReminders(
  user: ReminderUser,
  now: Date,
  opts: { mode: ScheduleMode; workoutName?: string; completedToday?: boolean }
): PlannedReminder[] {
  if (!user.whatsappOptIn || !user.phone) return []
  const hour = user.reminderHour ?? DEFAULT_REMINDER_HOUR
  if (opts.mode === "hourly" && lagosHour(now) !== hour) return []

  const day = lagosDateKey(now)
  const name = firstName(user.name)
  const out: PlannedReminder[] = []

  if (!opts.completedToday) {
    out.push({ type: "workout_reminder", dedupeType: "workout_reminder", day, params: [name, opts.workoutName || "today's workout"] })
  }

  const isActive = user.subscriptionStatus === "active"
  const endIso = isActive ? user.subscriptionCurrentPeriodEnd : user.subscriptionStatus === "trialing" ? user.trialEndsAt : null
  if (endIso) {
    const end = new Date(endIso)
    if (!Number.isNaN(end.getTime()) && end > now) {
      const daysLeft = lagosDayDiff(now, end)
      if (daysLeft === 3 || daysLeft === 1) {
        out.push({
          type: "payment_due",
          dedupeType: `payment_due_${daysLeft}`,
          day,
          params: [name, String(daysLeft), lagosDateKey(end), isActive ? "subscription" : "free trial"],
        })
      }
    }
  }
  return out
}

export function paymentFailedReminder(user: ReminderUser, now: Date): PlannedReminder | null {
  if (!user.whatsappOptIn || !user.phone) return null
  return { type: "payment_failed", dedupeType: "payment_failed", day: lagosDateKey(now), params: [firstName(user.name)] }
}
