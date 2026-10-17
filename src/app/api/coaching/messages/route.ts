import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { ID, Query } from "node-appwrite"
import { requireMember } from "@/lib/member-guard"
import { serverDatabases } from "@/lib/appwrite/server"
import { DATABASE_ID, COACHING_MESSAGES_COLLECTION_ID } from "@/lib/appwrite/schema"

const messageSchema = z.object({
  content: z.string().trim().min(1).max(2000),
})

export async function GET() {
  const gate = await requireMember()
  if (gate.error) return gate.error
  const session = gate.session

  const result = await serverDatabases.listDocuments(DATABASE_ID, COACHING_MESSAGES_COLLECTION_ID, [
    Query.equal("userId", session.user.id),
    Query.orderAsc("createdAt"),
    Query.limit(200),
  ])

  return NextResponse.json({ messages: result.documents })
}

export async function POST(req: NextRequest) {
  const gate = await requireMember()
  if (gate.error) return gate.error
  const session = gate.session

  const body = await req.json().catch(() => null)
  const parsed = messageSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Please write a message." }, { status: 400 })
  }

  const message = await serverDatabases.createDocument(DATABASE_ID, COACHING_MESSAGES_COLLECTION_ID, ID.unique(), {
    userId: session.user.id,
    senderId: session.user.id,
    senderName: session.user.name ?? "Athlete",
    isFromAdmin: false,
    content: parsed.data.content,
    createdAt: new Date().toISOString(),
  })

  return NextResponse.json({ success: true, message })
}
