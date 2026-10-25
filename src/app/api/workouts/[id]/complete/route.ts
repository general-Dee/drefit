import { NextRequest, NextResponse } from "next/server"
import { ID } from "@/lib/db/query"
import { z } from "zod"
import { requireMember } from "@/lib/member-guard"
import { db } from "@/lib/db/client"
import { WORKOUT_COMPLETIONS_COLLECTION_ID } from "@/lib/db/schema"
import { resolveCompletedAt } from "@/lib/completion-time"

// Optional body from the offline queue: a client-generated id (used as the
// document id so replays are idempotent) and the time it was completed.
const bodySchema = z
  .object({
    clientId: z.string().regex(/^c[a-f0-9]{1,35}$/).optional(),
    completedAt: z.string().datetime({ offset: true }).optional(),
  })
  .partial()

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireMember()
  if (gate.error) return gate.error
  const session = gate.session

  const raw = await req.json().catch(() => ({}))
  const parsed = bodySchema.safeParse(raw ?? {})
  const body = parsed.success ? parsed.data : {}

  const userId = session.user.id
  try {
    const completion = await db.createDocument(
      WORKOUT_COMPLETIONS_COLLECTION_ID,
      body.clientId ?? ID.unique(),
      {
        userId,
        workoutId: params.id,
        completedAt: resolveCompletedAt(body.completedAt, new Date()),
      }
    )
    return NextResponse.json({ success: true, completion })
  } catch (err) {
    if ((err as { code?: number })?.code === 409) {
      return NextResponse.json({ success: true, duplicate: true }, { status: 409 })
    }
    throw err
  }
}
