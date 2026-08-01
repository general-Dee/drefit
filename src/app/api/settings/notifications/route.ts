import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { serverDatabases } from "@/lib/appwrite/server"
import { DATABASE_ID, USERS_COLLECTION_ID } from "@/lib/appwrite/schema"

const notificationsSchema = z.object({
  notificationsEnabled: z.boolean(),
})

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = notificationsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }

  await serverDatabases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, session.user.id, {
    notificationsEnabled: parsed.data.notificationsEnabled,
  })

  return NextResponse.json({ success: true })
}
