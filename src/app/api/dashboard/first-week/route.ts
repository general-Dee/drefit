import { NextResponse } from "next/server"
import { requireMember } from "@/lib/member-guard"
import { loadFirstWeek } from "@/lib/first-week-store"
import { lagosDateKey } from "@/lib/lagos-time"

// "Your first week" card: shown while the member is on their free trial.
export async function GET() {
  const gate = await requireMember()
  if (gate.error) return gate.error
  const { user } = gate.session
  const trialActive = user.subscriptionStatus === "trialing" && !!user.trialEndsAt && new Date(user.trialEndsAt) > new Date()
  const plan = await loadFirstWeek(user.id)
  return NextResponse.json({ plan, show: trialActive && !!plan, today: lagosDateKey(new Date()) })
}
