import { NextResponse } from "next/server"
import { Query } from "@/lib/db/query"
import type { Doc } from "@/lib/db/client"
import { requireMember } from "@/lib/member-guard"
import { db } from "@/lib/db/client"
import { DIET_PLANS_COLLECTION_ID, USERS_COLLECTION_ID, type UserDoc } from "@/lib/db/schema"

export async function GET() {
  const gate = await requireMember()
  if (gate.error) return gate.error
  const session = gate.session

  const user = (await db.getDocument(
    USERS_COLLECTION_ID,
    session.user.id
  )) as unknown as UserDoc

  let plans: Doc[] = []
  if (user.dietaryPreference) {
    const filtered = await db.listDocuments(DIET_PLANS_COLLECTION_ID, [
      Query.equal("dietaryPreference", user.dietaryPreference),
      Query.limit(100),
    ])
    plans = filtered.documents
  }

  // Fall back to the full library if personalized filtering comes up empty
  // (e.g. the seeded library doesn't cover this user's diet preference yet).
  if (plans.length === 0) {
    const all = await db.listDocuments(DIET_PLANS_COLLECTION_ID, [
      Query.limit(100),
    ])
    plans = all.documents
  }

  return NextResponse.json({ plans })
}
