import { NextRequest, NextResponse } from "next/server"
import { ID, Query } from "@/lib/db/query"
import { requireMember } from "@/lib/member-guard"
import { db } from "@/lib/db/client"
import { PROGRESS_PHOTOS_COLLECTION_ID } from "@/lib/db/schema"
import { MAX_PHOTO_BYTES, photoPathname, photoStorageConfigured, storePhoto } from "@/lib/photo-storage"

export async function POST(req: NextRequest) {
  const gate = await requireMember()
  if (gate.error) return gate.error
  const session = gate.session

  const formData = await req.formData().catch(() => null)
  const file = formData?.get("file")
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No photo provided." }, { status: 400 })
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Please upload an image file." }, { status: 400 })
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return NextResponse.json({ error: "Please upload an image under 5MB." }, { status: 400 })
  }
  if (!photoStorageConfigured()) {
    console.error("progress photo upload: BLOB_READ_WRITE_TOKEN is not set")
    return NextResponse.json({ error: "Photo storage is not configured." }, { status: 503 })
  }

  const userId = session.user.id
  const fileId = ID.unique()
  const pathname = photoPathname(userId, fileId, file.type)
  const buffer = Buffer.from(await file.arrayBuffer())
  await storePhoto(pathname, buffer, file.type)

  const photo = await db.createDocument(PROGRESS_PHOTOS_COLLECTION_ID, ID.unique(), {
    userId,
    fileId,
    takenAt: new Date().toISOString(),
    blobPathname: pathname,
    contentType: file.type,
  })

  return NextResponse.json({ success: true, photo })
}

export async function GET() {
  const gate = await requireMember()
  if (gate.error) return gate.error
  const session = gate.session

  const result = await db.listDocuments(PROGRESS_PHOTOS_COLLECTION_ID, [
    Query.equal("userId", session.user.id),
    Query.orderDesc("takenAt"),
    Query.limit(20),
  ])

  return NextResponse.json({ photos: result.documents })
}
