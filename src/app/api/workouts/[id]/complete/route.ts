import { NextRequest, NextResponse } from "next/server"
import { ID, Permission, Role } from "node-appwrite"
import { requireMember } from "@/lib/member-guard"
import { serverDatabases } from "@/lib/appwrite/server"
import { DATABASE_ID, WORKOUT_COMPLETIONS_COLLECTION_ID } from "@/lib/appwrite/schema"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireMember()
  if (gate.error) return gate.error
  const session = gate.session

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
