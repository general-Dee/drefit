import { NextRequest, NextResponse } from "next/server"
import { Query } from "node-appwrite"
import { auth } from "@/lib/auth"
import { serverDatabases, serverStorage } from "@/lib/appwrite/server"
import { DATABASE_ID, PROGRESS_PHOTOS_BUCKET_ID, PROGRESS_PHOTOS_COLLECTION_ID } from "@/lib/appwrite/schema"

export async function GET(req: NextRequest, { params }: { params: { fileId: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const owned = await serverDatabases.listDocuments(DATABASE_ID, PROGRESS_PHOTOS_COLLECTION_ID, [
    Query.equal("fileId", params.fileId),
    Query.equal("userId", session.user.id),
    Query.limit(1),
  ])

  if (owned.documents.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const bytes = await serverStorage.getFileView({
    bucketId: PROGRESS_PHOTOS_BUCKET_ID,
    fileId: params.fileId,
  })

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, max-age=3600",
    },
  })
}
