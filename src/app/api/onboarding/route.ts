import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { serverDatabases } from "@/lib/appwrite/server"
import { DATABASE_ID, USERS_COLLECTION_ID } from "@/lib/appwrite/schema"

const onboardingSchema = z.object({
  fitnessGoal: z.enum(["weight-loss", "muscle-gain", "endurance"]),
  fitnessLevel: z.enum(["beginner", "intermediate", "advanced"]),
  dietaryPreference: z.enum(["omnivore", "vegetarian", "keto", "halal"]),
  schedule: z.enum(["morning", "afternoon", "evening"]),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = onboardingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid onboarding answers." }, { status: 400 })
  }

  await serverDatabases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, session.user.id, parsed.data)

  return NextResponse.json({ success: true })
}
