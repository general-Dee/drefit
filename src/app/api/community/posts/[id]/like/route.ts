import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { serverDatabases } from "@/lib/appwrite/server"
import { DATABASE_ID, COMMUNITY_POSTS_COLLECTION_ID, type CommunityPostDoc } from "@/lib/appwrite/schema"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

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
