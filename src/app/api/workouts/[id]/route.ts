import { NextRequest, NextResponse } from "next/server"
import { Query } from "node-appwrite"
import { auth } from "@/lib/auth"
import { serverDatabases } from "@/lib/appwrite/server"
import { DATABASE_ID, WORKOUTS_COLLECTION_ID, WORKOUT_COMPLETIONS_COLLECTION_ID } from "@/lib/appwrite/schema"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const workout = await serverDatabases
    .getDocument(DATABASE_ID, WORKOUTS_COLLECTION_ID, params.id)
    .catch(() => null)

  if (!workout) {
    return NextResponse.json({ error: "Workout not found" }, { status: 404 })
  }

  const completions = await serverDatabases.listDocuments(DATABASE_ID, WORKOUT_COMPLETIONS_COLLECTION_ID, [
    Query.equal("workoutId", params.id),
    Query.equal("userId", session.user.id),
    Query.orderDesc("completedAt"),
    Query.limit(1),
  ])

  return NextResponse.json({
    workout,
    completionCount: completions.total,
    lastCompletedAt: completions.documents[0]?.completedAt ?? null,
  })
}
