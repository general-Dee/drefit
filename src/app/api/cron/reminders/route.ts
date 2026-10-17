import { NextRequest, NextResponse } from "next/server"
import { Query } from "node-appwrite"
import { serverDatabases } from "@/lib/appwrite/server"
import { DATABASE_ID, USERS_COLLECTION_ID, WORKOUT_COMPLETIONS_COLLECTION_ID, type AppwriteUserDoc } from "@/lib/appwrite/schema"
import { isAuthorizedCron } from "@/lib/cron-auth"
import { lagosDateKey } from "@/lib/lagos-time"
import { getWhatsAppConfig, PENDING_CONFIG_MESSAGE } from "@/lib/whatsapp/config"
import { planReminders, type ScheduleMode } from "@/lib/whatsapp/reminders"
import { sendReminderOnce, type SendResult } from "@/lib/whatsapp/send"
import { todaysPlannedWorkoutName } from "@/lib/reminder-context"

export const dynamic = "force-dynamic"
export const maxDuration = 60

// Called by Vercel Cron (daily on the Hobby plan, see vercel.json) and
// optionally by an hourly external scheduler with ?mode=hourly.
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req.headers.get("authorization"), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const q = req.nextUrl.searchParams.get("mode")
  const mode: ScheduleMode = q === "hourly" || q === "daily" ? q : process.env.REMINDER_CRON_MODE === "hourly" ? "hourly" : "daily"

  if (!getWhatsAppConfig()) {
    console.log(PENDING_CONFIG_MESSAGE)
    return NextResponse.json({ ok: true, mode, status: "pending_configuration", sent: 0 })
  }

  const now = new Date()
  const today = lagosDateKey(now)
  const counts: Record<SendResult, number> = { sent: 0, duplicate: 0, pending_config: 0, failed: 0 }
  let cursor: string | undefined
  let scanned = 0

  do {
    const page = await serverDatabases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
      Query.equal("whatsappOptIn", true),
      Query.limit(100),
      ...(cursor ? [Query.cursorAfter(cursor)] : []),
    ])
    const users = page.documents as unknown as AppwriteUserDoc[]
    for (const user of users) {
      scanned += 1
      const completions = await serverDatabases.listDocuments(DATABASE_ID, WORKOUT_COMPLETIONS_COLLECTION_ID, [
        Query.equal("userId", user.$id),
        Query.orderDesc("completedAt"),
        Query.limit(1),
      ])
      const last = completions.documents[0] as unknown as { completedAt?: string } | undefined
      const completedToday = !!last?.completedAt && lagosDateKey(new Date(last.completedAt)) === today
      const reminders = planReminders(user, now, { mode, completedToday, workoutName: todaysPlannedWorkoutName(user, now) })
      for (const r of reminders) counts[await sendReminderOnce(user, r)] += 1
    }
    cursor = users.length === 100 ? users[users.length - 1].$id : undefined
  } while (cursor)

  return NextResponse.json({ ok: true, mode, scanned, ...counts })
}
