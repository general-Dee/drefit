import { NextResponse } from "next/server"
import { Query, type Models } from "node-appwrite"
import { auth } from "@/lib/auth"
import { serverDatabases } from "@/lib/appwrite/server"
import { DATABASE_ID, DIET_PLANS_COLLECTION_ID, USERS_COLLECTION_ID, type AppwriteUserDoc } from "@/lib/appwrite/schema"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = (await serverDatabases.getDocument(
    DATABASE_ID,
    USERS_COLLECTION_ID,
    session.user.id
  )) as unknown as AppwriteUserDoc

  let plans: Models.Document[] = []
  if (user.dietaryPreference) {
    const filtered = await serverDatabases.listDocuments(DATABASE_ID, DIET_PLANS_COLLECTION_ID, [
      Query.equal("dietaryPreference", user.dietaryPreference),
      Query.limit(100),
    ])
    plans = filtered.documents
  }

  // Fall back to the full library if personalized filtering comes up empty
  // (e.g. the seeded library doesn't cover this user's diet preference yet).
  if (plans.length === 0) {
    const all = await serverDatabases.listDocuments(DATABASE_ID, DIET_PLANS_COLLECTION_ID, [
      Query.limit(100),
    ])
    plans = all.documents
  }

  return NextResponse.json({ plans })
}
