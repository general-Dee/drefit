import { NextRequest, NextResponse } from "next/server"
import { Query } from "@/lib/db/query"
import { requireMember } from "@/lib/member-guard"
import { db } from "@/lib/db/client"
import { PROGRESS_PHOTOS_COLLECTION_ID, type ProgressPhotoDoc } from "@/lib/db/schema"
import { photoStorageConfigured, readPhoto } from "@/lib/photo-storage"

export async function GET(req: NextRequest, { params }: { params: { fileId: string } }) {
  const gate = await requireMember()
  if (gate.error) return gate.error
  const session = gate.session

  // Ownership check: only the member who uploaded a photo can view it.
  const owned = await db.listDocuments<ProgressPhotoDoc>(PROGRESS_PHOTOS_COLLECTION_ID, [
    Query.equal("fileId", params.fileId),
    Query.equal("userId", session.user.id),
    Query.limit(1),
  ])
  const photo = owned.documents[0]
  if (!photo || !photo.blobPathname) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (!photoStorageConfigured()) {
    return NextResponse.json({ error: "Photo storage is not configured." }, { status: 503 })
  }

  const blob = await readPhoto(photo.blobPathname)
  if (!blob) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return new NextResponse(blob.stream, {
    headers: {
      "Content-Type": blob.blob.contentType || photo.contentType || "image/jpeg",
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
