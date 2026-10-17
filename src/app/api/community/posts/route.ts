import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { ID, Query } from "node-appwrite"
import { requireMember } from "@/lib/member-guard"
import { serverDatabases } from "@/lib/appwrite/server"
import { DATABASE_ID, COMMUNITY_POSTS_COLLECTION_ID } from "@/lib/appwrite/schema"

const postSchema = z.object({
  content: z.string().trim().min(1).max(1000),
})

export async function GET() {
  const gate = await requireMember()
  if (gate.error) return gate.error
  const session = gate.session

  const result = await serverDatabases.listDocuments(DATABASE_ID, COMMUNITY_POSTS_COLLECTION_ID, [
    Query.orderDesc("createdAt"),
    Query.limit(50),
  ])

  return NextResponse.json({ posts: result.documents })
}

export async function POST(req: NextRequest) {
  const gate = await requireMember()
  if (gate.error) return gate.error
  const session = gate.session

  const body = await req.json().catch(() => null)
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Please write something to post." }, { status: 400 })
  }

  const post = await serverDatabases.createDocument(DATABASE_ID, COMMUNITY_POSTS_COLLECTION_ID, ID.unique(), {
    userId: session.user.id,
    userName: session.user.name ?? "Athlete",
    content: parsed.data.content,
    likedBy: [],
    createdAt: new Date().toISOString(),
  })

  return NextResponse.json({ success: true, post })
}
