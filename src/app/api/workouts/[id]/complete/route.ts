import { NextRequest, NextResponse } from "next/server"
import { ID, Permission, Role } from "node-appwrite"
import { auth } from "@/lib/auth"
import { serverDatabases } from "@/lib/appwrite/server"
import { DATABASE_ID, WORKOUT_COMPLETIONS_COLLECTION_ID } from "@/lib/appwrite/schema"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id
  const completion = await serverDatabases.createDocument(
    DATABASE_ID,
    WORKOUT_COMPLETIONS_COLLECTION_ID,
    ID.unique(),
    {
      userId,
      workoutId: params.id,
      completedAt: new Date().toISOString(),
    },
    [Permission.read(Role.user(userId)), Permission.write(Role.user(userId))]
  )

  return NextResponse.json({ success: true, completion })
}
