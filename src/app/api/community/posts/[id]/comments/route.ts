import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { ID, Query } from "node-appwrite"
import { requireMember } from "@/lib/member-guard"
import { serverDatabases } from "@/lib/appwrite/server"
import { DATABASE_ID, COMMUNITY_COMMENTS_COLLECTION_ID } from "@/lib/appwrite/schema"

const commentSchema = z.object({
  content: z.string().trim().min(1).max(500),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireMember()
  if (gate.error) return gate.error
  const session = gate.session

  const result = await serverDatabases.listDocuments(DATABASE_ID, COMMUNITY_COMMENTS_COLLECTION_ID, [
    Query.equal("postId", params.id),
    Query.orderAsc("createdAt"),
    Query.limit(200),
  ])

  return NextResponse.json({ comments: result.documents })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireMember()
  if (gate.error) return gate.error
  const session = gate.session

  const body = await req.json().catch(() => null)
  const parsed = commentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Please write a comment." }, { status: 400 })
  }

  const comment = await serverDatabases.createDocument(DATABASE_ID, COMMUNITY_COMMENTS_COLLECTION_ID, ID.unique(), {
    postId: params.id,
    userId: session.user.id,
    userName: session.user.name ?? "Athlete",
    content: parsed.data.content,
    createdAt: new Date().toISOString(),
  })

  return NextResponse.json({ success: true, comment })
}
