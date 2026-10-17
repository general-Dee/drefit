import { NextResponse } from "next/server"
import type { Session } from "next-auth"
import { auth } from "@/lib/auth"
import { hasActiveAccess } from "@/lib/subscription"

export type MemberAccessDecision =
  | { allowed: true }
  | { allowed: false; status: 401 | 402; body: { error: string; code: string } }

// Pure decision function (unit-tested): signed-in users need an active paid
// period or an unexpired trial; admins are always allowed. The session values
// are refreshed from Appwrite on every request by the NextAuth jwt callback,
// so webhook-driven subscription changes take effect without re-login.
export function decideMemberAccess(session: Session | null | undefined): MemberAccessDecision {
  if (!session?.user?.id) {
    return { allowed: false, status: 401, body: { error: "Unauthorized", code: "UNAUTHENTICATED" } }
  }
  if (session.user.role === "admin") return { allowed: true }
  if (
    hasActiveAccess(
      session.user.subscriptionStatus,
      session.user.trialEndsAt,
      session.user.subscriptionCurrentPeriodEnd
    )
  ) {
    return { allowed: true }
  }
  return {
    allowed: false,
    status: 402,
    body: {
      error: "An active subscription or free trial is required to access this feature.",
      code: "SUBSCRIPTION_REQUIRED",
    },
  }
}

type MemberGuardResult =
  | { error: NextResponse; session?: undefined }
  | { error?: undefined; session: Session }

// Use at the top of every member data API route.
export async function requireMember(): Promise<MemberGuardResult> {
  const session = await auth()
  const decision = decideMemberAccess(session)
  if (!decision.allowed) {
    return { error: NextResponse.json(decision.body, { status: decision.status }) }
  }
  return { session: session as Session }
}
