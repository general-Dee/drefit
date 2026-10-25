import { NextResponse } from "next/server"
import { Query } from "@/lib/db/query"
import { requireAdmin } from "@/lib/admin-guard"
import { db } from "@/lib/db/client"
import {
  USERS_COLLECTION_ID,
  COACHING_MESSAGES_COLLECTION_ID,
  type UserDoc,
  type CoachingMessageDoc,
} from "@/lib/db/schema"

export async function GET() {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  const result = await db.listDocuments(COACHING_MESSAGES_COLLECTION_ID, [
    Query.orderDesc("createdAt"),
    Query.limit(500),
  ])

  const latestByUser = new Map<string, CoachingMessageDoc>()
  for (const doc of result.documents as unknown as CoachingMessageDoc[]) {
    if (!latestByUser.has(doc.userId)) {
      latestByUser.set(doc.userId, doc)
    }
  }

  const userIds = [...latestByUser.keys()]
  if (userIds.length === 0) {
    return NextResponse.json({ threads: [] })
  }

  const users = await db.listDocuments(USERS_COLLECTION_ID, [
    Query.equal("$id", userIds),
  ])
  const namesById = new Map(
    (users.documents as unknown as UserDoc[]).map((u) => [u.$id, u.name])
  )

  const threads = userIds
    .map((userId) => {
      const last = latestByUser.get(userId)!
      return {
        userId,
        userName: namesById.get(userId) ?? "Athlete",
        lastMessage: last.content,
        lastMessageAt: last.createdAt,
        lastFromAdmin: last.isFromAdmin,
      }
    })
    .sort((a, b) => (a.lastMessageAt < b.lastMessageAt ? 1 : -1))

  return NextResponse.json({ threads })
}
