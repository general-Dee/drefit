import { NextResponse } from "next/server"
import { Query } from "@/lib/db/query"
import { requireMember } from "@/lib/member-guard"
import { db } from "@/lib/db/client"
import {
  USERS_COLLECTION_ID,
  WORKOUT_COMPLETIONS_COLLECTION_ID,
  type UserDoc,
  type WorkoutCompletionDoc,
} from "@/lib/db/schema"

export async function GET() {
  const gate = await requireMember()
  if (gate.error) return gate.error
  const session = gate.session

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const result = await db.listDocuments(WORKOUT_COMPLETIONS_COLLECTION_ID, [
    Query.greaterThanEqual("completedAt", sevenDaysAgo),
    Query.limit(500),
  ])

  const counts = new Map<string, number>()
  for (const doc of result.documents as unknown as WorkoutCompletionDoc[]) {
    counts.set(doc.userId, (counts.get(doc.userId) ?? 0) + 1)
  }

  const top = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  if (top.length === 0) {
    return NextResponse.json({ leaderboard: [] })
  }

  const users = await db.listDocuments(USERS_COLLECTION_ID, [
    Query.equal("$id", top.map(([userId]) => userId)),
  ])
  const namesById = new Map(
    (users.documents as unknown as UserDoc[]).map((u) => [u.$id, u.name])
  )

  const leaderboard = top.map(([userId, count]) => ({
    name: namesById.get(userId) ?? "Athlete",
    count,
  }))

  return NextResponse.json({ leaderboard })
}
