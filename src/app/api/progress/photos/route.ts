import { NextRequest, NextResponse } from "next/server"
import { ID, Permission, Query, Role } from "node-appwrite"
import { InputFile } from "node-appwrite/file"
import { requireMember } from "@/lib/member-guard"
import { serverDatabases, serverStorage } from "@/lib/appwrite/server"
import { DATABASE_ID, PROGRESS_PHOTOS_BUCKET_ID, PROGRESS_PHOTOS_COLLECTION_ID } from "@/lib/appwrite/schema"

const MAX_PHOTO_BYTES = 5 * 1024 * 1024

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

  const userId = session.user.id
  const buffer = Buffer.from(await file.arrayBuffer())
  const inputFile = InputFile.fromBuffer(buffer, file.name)

  const uploaded = await serverStorage.createFile(
    {
      bucketId: PROGRESS_PHOTOS_BUCKET_ID,
      fileId: ID.unique(),
      file: inputFile,
      permissions: [Permission.read(Role.user(userId)), Permission.write(Role.user(userId))],
    }
  )

  const photo = await serverDatabases.createDocument(
    DATABASE_ID,
    PROGRESS_PHOTOS_COLLECTION_ID,
    ID.unique(),
    {
      userId,
      fileId: uploaded.$id,
      takenAt: new Date().toISOString(),
    },
    [Permission.read(Role.user(userId)), Permission.write(Role.user(userId))]
  )

  return NextResponse.json({ success: true, photo })
}

export async function GET() {
  const gate = await requireMember()
  if (gate.error) return gate.error
  const session = gate.session

  const result = await serverDatabases.listDocuments(DATABASE_ID, PROGRESS_PHOTOS_COLLECTION_ID, [
    Query.equal("userId", session.user.id),
    Query.orderDesc("takenAt"),
    Query.limit(20),
  ])

  return NextResponse.json({ photos: result.documents })
}
