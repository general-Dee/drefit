import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db/client"
import { USERS_COLLECTION_ID } from "@/lib/db/schema"

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await db.updateDocument(USERS_COLLECTION_ID, session.user.id, {
    subscriptionStatus: "inactive",
  })

  return NextResponse.json({ success: true })
}
