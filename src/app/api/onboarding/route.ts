import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { serverDatabases } from "@/lib/appwrite/server"
import { DATABASE_ID, USERS_COLLECTION_ID } from "@/lib/appwrite/schema"
import { LIMITATIONS } from "@/lib/first-week-plan"
import { generateAndSaveFirstWeek } from "@/lib/first-week-store"
import { lagosDateKey } from "@/lib/lagos-time"

const onboardingSchema = z.object({
  fitnessGoal: z.enum(["weight-loss", "muscle-gain", "endurance"]),
  fitnessLevel: z.enum(["beginner", "intermediate", "advanced"]),
  daysPerWeek: z.number().int().min(2).max(6),
  equipment: z.enum(["none", "home", "gym"]),
  limitations: z.array(z.enum(LIMITATIONS)).max(LIMITATIONS.length).default([]),
  limitationsNote: z.string().trim().max(300).optional().default(""),
  dietaryPreference: z.enum(["omnivore", "vegetarian", "keto", "halal"]),
  schedule: z.enum(["morning", "afternoon", "evening"]).optional(),
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
  const a = parsed.data
  const limitations = [...new Set(a.limitations)]

  await serverDatabases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, session.user.id, {
    fitnessGoal: a.fitnessGoal,
    fitnessLevel: a.fitnessLevel,
    dietaryPreference: a.dietaryPreference,
    daysPerWeek: a.daysPerWeek,
    equipment: a.equipment,
    limitationsJson: JSON.stringify(limitations),
    limitationsNote: a.limitationsNote,
    ...(a.schedule ? { schedule: a.schedule } : {}),
  })

  const plan = await generateAndSaveFirstWeek(
    session.user.id,
    {
      fitnessGoal: a.fitnessGoal,
      fitnessLevel: a.fitnessLevel,
      daysPerWeek: a.daysPerWeek,
      equipment: a.equipment,
      limitations,
      dietaryPreference: a.dietaryPreference,
    },
    lagosDateKey(new Date())
  )

  return NextResponse.json({ success: true, plan })
}
