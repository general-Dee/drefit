import { NextRequest, NextResponse } from "next/server"
import { Query } from "@/lib/db/query"
import { requireMember } from "@/lib/member-guard"
import { db } from "@/lib/db/client"
import { REFERRALS_COLLECTION_ID, USERS_COLLECTION_ID, type UserDoc } from "@/lib/db/schema"
import { ensureReferralCode, referralLink, REFERRAL_REWARD_DAYS } from "@/lib/referrals"

export async function GET(req: NextRequest) {
  const gate = await requireMember()
  if (gate.error) return gate.error
  const userId = gate.session.user.id

  const user = (await db.getDocument(USERS_COLLECTION_ID, userId)) as unknown as UserDoc
  const code = await ensureReferralCode(user)
  const origin = process.env.NEXTAUTH_URL?.startsWith("https://") ? process.env.NEXTAUTH_URL : req.nextUrl.origin

  const [signups, rewarded] = await Promise.all([
    db.listDocuments(USERS_COLLECTION_ID, [Query.equal("referredBy", userId), Query.limit(1), Query.select(["$id"])]),
    db.listDocuments(REFERRALS_COLLECTION_ID, [
      Query.equal("referrerId", userId),
      Query.equal("status", "rewarded"),
      Query.limit(1),
    ]),
  ])

  return NextResponse.json({
    code,
    link: referralLink(origin, code),
    signups: signups.total,
    rewardedReferrals: rewarded.total,
    rewardDaysEarned: rewarded.total * REFERRAL_REWARD_DAYS,
    rewardDaysPerReferral: REFERRAL_REWARD_DAYS,
  })
}
