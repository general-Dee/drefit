import { NextRequest, NextResponse } from "next/server"
import { Query } from "node-appwrite"
import { requireMember } from "@/lib/member-guard"
import { serverDatabases } from "@/lib/appwrite/server"
import { DATABASE_ID, REFERRALS_COLLECTION_ID, USERS_COLLECTION_ID, type AppwriteUserDoc } from "@/lib/appwrite/schema"
import { ensureReferralCode, referralLink, REFERRAL_REWARD_DAYS } from "@/lib/referrals"

export async function GET(req: NextRequest) {
  const gate = await requireMember()
  if (gate.error) return gate.error
  const userId = gate.session.user.id

  const user = (await serverDatabases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, userId)) as unknown as AppwriteUserDoc
  const code = await ensureReferralCode(user)
  const origin = process.env.NEXTAUTH_URL?.startsWith("https://") ? process.env.NEXTAUTH_URL : req.nextUrl.origin

  const [signups, rewarded] = await Promise.all([
    serverDatabases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [Query.equal("referredBy", userId), Query.limit(1), Query.select(["$id"])]),
    serverDatabases.listDocuments(DATABASE_ID, REFERRALS_COLLECTION_ID, [
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
