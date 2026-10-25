import { NextRequest, NextResponse } from "next/server"
import { Query } from "@/lib/db/query"
import { requireMember } from "@/lib/member-guard"
import { db } from "@/lib/db/client"
import { WORKOUTS_COLLECTION_ID, WORKOUT_COMPLETIONS_COLLECTION_ID } from "@/lib/db/schema"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireMember()
  if (gate.error) return gate.error
  const session = gate.session

  const workout = await db
    .getDocument(WORKOUTS_COLLECTION_ID, params.id)
    .catch(() => null)

  if (!workout) {
    return NextResponse.json({ error: "Workout not found" }, { status: 404 })
  }

  const completions = await db.listDocuments(WORKOUT_COMPLETIONS_COLLECTION_ID, [
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
