import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { serverDatabases } from "@/lib/appwrite/server"
import { DATABASE_ID, USERS_COLLECTION_ID, type AppwriteUserDoc } from "@/lib/appwrite/schema"

const profileSchema = z.object({
  name: z.string().trim().min(1).max(80),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = (await serverDatabases.getDocument(
    DATABASE_ID,
    USERS_COLLECTION_ID,
    session.user.id
  )) as unknown as AppwriteUserDoc

  return NextResponse.json({
    name: user.name,
    email: user.email,
    notificationsEnabled: user.notificationsEnabled ?? true,
  })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = profileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a valid name." }, { status: 400 })
  }

  await serverDatabases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, session.user.id, {
    name: parsed.data.name,
  })

  return NextResponse.json({ success: true })
}
