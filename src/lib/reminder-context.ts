import type { AppwriteUserDoc } from "@/lib/appwrite/schema"

// Name of today's planned workout for reminder copy. Extended once the
// first-week plan exists; falls back to a generic label.
export function todaysPlannedWorkoutName(_user: AppwriteUserDoc, _now: Date): string | undefined {
  return undefined
}
