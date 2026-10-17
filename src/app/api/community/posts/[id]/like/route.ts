import { NextRequest, NextResponse } from "next/server"
import { requireMember } from "@/lib/member-guard"
import { serverDatabases } from "@/lib/appwrite/server"
import { DATABASE_ID, COMMUNITY_POSTS_COLLECTION_ID, type CommunityPostDoc } from "@/lib/appwrite/schema"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireMember()
  if (gate.error) return gate.error
  const session = gate.session

  const post = (await serverDatabases
    .getDocument(DATABASE_ID, COMMUNITY_POSTS_COLLECTION_ID, params.id)
    .catch(() => null)) as unknown as CommunityPostDoc | null

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  const userId = session.user.id
  const likedBy = post.likedBy ?? []
  const nextLikedBy = likedBy.includes(userId)
    ? likedBy.filter((id) => id !== userId)
    : [...likedBy, userId]

  const updated = await serverDatabases.updateDocument(DATABASE_ID, COMMUNITY_POSTS_COLLECTION_ID, params.id, {
    likedBy: nextLikedBy,
  })

  return NextResponse.json({ success: true, post: updated })
}
