import { NextResponse } from "next/server"
import { Query, type Models } from "node-appwrite"
import { auth } from "@/lib/auth"
import { serverDatabases } from "@/lib/appwrite/server"
import { DATABASE_ID, USERS_COLLECTION_ID, WORKOUTS_COLLECTION_ID, type AppwriteUserDoc } from "@/lib/appwrite/schema"

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

  let workouts: Models.Document[] = []
  if (user.fitnessGoal) {
    const filtered = await serverDatabases.listDocuments(DATABASE_ID, WORKOUTS_COLLECTION_ID, [
      Query.equal("goal", user.fitnessGoal),
      Query.limit(100),
    ])
    workouts = filtered.documents
  }

  // Fall back to the full library if personalized filtering comes up empty
  // (e.g. the seeded library doesn't cover this user's goal yet).
  if (workouts.length === 0) {
    const all = await serverDatabases.listDocuments(DATABASE_ID, WORKOUTS_COLLECTION_ID, [
      Query.limit(100),
    ])
    workouts = all.documents
  }

  return NextResponse.json({ workouts })
}
