import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { serverDatabases } from "@/lib/appwrite/server"
import { DATABASE_ID, USERS_COLLECTION_ID } from "@/lib/appwrite/schema"

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await serverDatabases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, session.user.id, {
    subscriptionStatus: "inactive",
  })

  return NextResponse.json({ success: true })
}
