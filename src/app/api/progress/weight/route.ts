import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { ID, Query } from "@/lib/db/query"
import { requireMember } from "@/lib/member-guard"
import { db } from "@/lib/db/client"
import { PROGRESS_LOGS_COLLECTION_ID } from "@/lib/db/schema"

const weightSchema = z.object({
  weight: z.number().positive().max(500),
  loggedAt: z.string().datetime().optional(),
})

export async function POST(req: NextRequest) {
  const gate = await requireMember()
  if (gate.error) return gate.error
  const session = gate.session

  const body = await req.json().catch(() => null)
  const parsed = weightSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid weight entry." }, { status: 400 })
  }

  const userId = session.user.id
  const log = await db.createDocument(
    PROGRESS_LOGS_COLLECTION_ID,
    ID.unique(),
    {
      userId,
      weight: parsed.data.weight,
      loggedAt: parsed.data.loggedAt ?? new Date().toISOString(),
    }
  )

  return NextResponse.json({ success: true, log })
}

export async function GET() {
  const gate = await requireMember()
  if (gate.error) return gate.error
  const session = gate.session

  const result = await db.listDocuments(PROGRESS_LOGS_COLLECTION_ID, [
    Query.equal("userId", session.user.id),
    Query.orderDesc("loggedAt"),
    Query.limit(100),
  ])

  return NextResponse.json({ logs: result.documents })
}
