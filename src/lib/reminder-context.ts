import type { AppwriteUserDoc } from "@/lib/appwrite/schema"
import { planDayFor } from "@/lib/first-week-plan"
import { loadFirstWeek } from "@/lib/first-week-store"
import { lagosDateKey } from "@/lib/lagos-time"

// Name of today's planned workout (from the first-week plan) for reminder
// copy. undefined = no plan for today (generic label); null = planned rest day.
export async function todaysPlannedWorkoutName(user: AppwriteUserDoc, now: Date): Promise<string | null | undefined> {
  const plan = await loadFirstWeek(user.$id).catch(() => null)
  const day = planDayFor(plan, lagosDateKey(now))
  if (day?.type === "workout") return day.workout?.name
  if (day?.type === "mobility") return "a gentle mobility session"
  if (day?.type === "rest") return null
  return undefined
}
