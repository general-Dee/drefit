import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { ID, Permission, Query, Role } from "node-appwrite"
import { auth } from "@/lib/auth"
import { serverDatabases } from "@/lib/appwrite/server"
import { DATABASE_ID, PROGRESS_LOGS_COLLECTION_ID } from "@/lib/appwrite/schema"

const weightSchema = z.object({
  weight: z.number().positive().max(500),
  loggedAt: z.string().datetime().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = weightSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid weight entry." }, { status: 400 })
  }

  const userId = session.user.id
  const log = await serverDatabases.createDocument(
    DATABASE_ID,
    PROGRESS_LOGS_COLLECTION_ID,
    ID.unique(),
    {
      userId,
      weight: parsed.data.weight,
      loggedAt: parsed.data.loggedAt ?? new Date().toISOString(),
    },
    [Permission.read(Role.user(userId)), Permission.write(Role.user(userId))]
  )

  return NextResponse.json({ success: true, log })
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await serverDatabases.listDocuments(DATABASE_ID, PROGRESS_LOGS_COLLECTION_ID, [
    Query.equal("userId", session.user.id),
    Query.orderDesc("loggedAt"),
    Query.limit(100),
  ])

  return NextResponse.json({ logs: result.documents })
}
