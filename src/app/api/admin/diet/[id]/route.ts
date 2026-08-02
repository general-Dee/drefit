import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { Query } from "node-appwrite"
import { requireAdmin } from "@/lib/admin-guard"
import { serverDatabases } from "@/lib/appwrite/server"
import { DATABASE_ID, DIET_PLANS_COLLECTION_ID } from "@/lib/appwrite/schema"

const dietPlanSchema = z.object({
  dietaryPreference: z.enum(["omnivore", "vegetarian", "keto", "halal"]),
  day: z.string().trim().min(1).max(50),
  breakfast: z.string().trim().min(1).max(500),
  lunch: z.string().trim().min(1).max(500),
  dinner: z.string().trim().min(1).max(500),
  snack: z.string().trim().min(1).max(500),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  const plan = await serverDatabases
    .getDocument(DATABASE_ID, DIET_PLANS_COLLECTION_ID, params.id)
    .catch(() => null)

  if (!plan) {
    return NextResponse.json({ error: "Diet plan not found" }, { status: 404 })
  }

  return NextResponse.json({ plan })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  const body = await req.json().catch(() => null)
  const parsed = dietPlanSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the diet plan fields." }, { status: 400 })
  }

  const existing = await serverDatabases.listDocuments(DATABASE_ID, DIET_PLANS_COLLECTION_ID, [
    Query.equal("dietaryPreference", parsed.data.dietaryPreference),
    Query.equal("day", parsed.data.day),
    Query.limit(1),
  ])
  if (existing.total > 0 && existing.documents[0].$id !== params.id) {
    return NextResponse.json(
      { error: `A ${parsed.data.dietaryPreference} plan for ${parsed.data.day} already exists.` },
      { status: 409 }
    )
  }

  const plan = await serverDatabases
    .updateDocument(DATABASE_ID, DIET_PLANS_COLLECTION_ID, params.id, parsed.data)
    .catch(() => null)

  if (!plan) {
    return NextResponse.json({ error: "Diet plan not found" }, { status: 404 })
  }

  return NextResponse.json({ success: true, plan })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  await serverDatabases.deleteDocument(DATABASE_ID, DIET_PLANS_COLLECTION_ID, params.id).catch(() => null)

  return NextResponse.json({ success: true })
}
