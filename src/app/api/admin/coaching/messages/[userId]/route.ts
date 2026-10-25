import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { ID, Query } from "@/lib/db/query"
import { requireAdmin } from "@/lib/admin-guard"
import { db } from "@/lib/db/client"
import { COACHING_MESSAGES_COLLECTION_ID } from "@/lib/db/schema"

const messageSchema = z.object({
  content: z.string().trim().min(1).max(2000),
})

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  const result = await db.listDocuments(COACHING_MESSAGES_COLLECTION_ID, [
    Query.equal("userId", params.userId),
    Query.orderAsc("createdAt"),
    Query.limit(200),
  ])

  return NextResponse.json({ messages: result.documents })
}

export async function POST(req: NextRequest, { params }: { params: { userId: string } }) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  const body = await req.json().catch(() => null)
  const parsed = messageSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Please write a message." }, { status: 400 })
  }

  const message = await db.createDocument(COACHING_MESSAGES_COLLECTION_ID, ID.unique(), {
    userId: params.userId,
    senderId: gate.session.user.id,
    senderName: gate.session.user.name ?? "Coach",
    isFromAdmin: true,
    content: parsed.data.content,
    createdAt: new Date().toISOString(),
  })

  return NextResponse.json({ success: true, message })
}
