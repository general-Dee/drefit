import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { ID, Query } from "@/lib/db/query"
import { requireAdmin } from "@/lib/admin-guard"
import { db } from "@/lib/db/client"
import { DIET_PLANS_COLLECTION_ID } from "@/lib/db/schema"

const dietPlanSchema = z.object({
  dietaryPreference: z.enum(["omnivore", "vegetarian", "keto", "halal"]),
  day: z.string().trim().min(1).max(50),
  breakfast: z.string().trim().min(1).max(500),
  lunch: z.string().trim().min(1).max(500),
  dinner: z.string().trim().min(1).max(500),
  snack: z.string().trim().min(1).max(500),
})

export async function GET() {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  const result = await db.listDocuments(DIET_PLANS_COLLECTION_ID, [Query.limit(200)])
  return NextResponse.json({ plans: result.documents })
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  const body = await req.json().catch(() => null)
  const parsed = dietPlanSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the diet plan fields." }, { status: 400 })
  }

  const existing = await db.listDocuments(DIET_PLANS_COLLECTION_ID, [
    Query.equal("dietaryPreference", parsed.data.dietaryPreference),
    Query.equal("day", parsed.data.day),
    Query.limit(1),
  ])
  if (existing.total > 0) {
    return NextResponse.json(
      { error: `A ${parsed.data.dietaryPreference} plan for ${parsed.data.day} already exists.` },
      { status: 409 }
    )
  }

  const plan = await db.createDocument(DIET_PLANS_COLLECTION_ID, ID.unique(), parsed.data)

  return NextResponse.json({ success: true, plan })
}
