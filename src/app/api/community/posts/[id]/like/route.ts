import { NextRequest, NextResponse } from "next/server"
import { requireMember } from "@/lib/member-guard"
import { db } from "@/lib/db/client"
import { COMMUNITY_POSTS_COLLECTION_ID, type CommunityPostDoc } from "@/lib/db/schema"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireMember()
  if (gate.error) return gate.error
  const session = gate.session

  const post = (await db
    .getDocument(COMMUNITY_POSTS_COLLECTION_ID, params.id)
    .catch(() => null)) as unknown as CommunityPostDoc | null

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  const userId = session.user.id
  const alreadyLiked = (post.likedBy ?? []).includes(userId)
  // Single atomic UPDATE on the text[] column, so concurrent likes are never lost.
  const updated = await db.toggleArrayValue(COMMUNITY_POSTS_COLLECTION_ID, params.id, "likedBy", userId, !alreadyLiked)

  return NextResponse.json({ success: true, post: updated })
}
