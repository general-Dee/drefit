import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { ID, Query } from "node-appwrite"
import { requireAdmin } from "@/lib/admin-guard"
import { serverDatabases } from "@/lib/appwrite/server"
import { DATABASE_ID, WORKOUTS_COLLECTION_ID } from "@/lib/appwrite/schema"

const exerciseSchema = z.object({
  name: z.string().trim().min(1).max(100),
  sets: z.number().int().positive().max(50),
  reps: z.number().int().positive().max(500),
  rest: z.number().int().min(0).max(600),
})

const workoutSchema = z.object({
  name: z.string().trim().min(1).max(255),
  muscleGroup: z.string().trim().min(1).max(255),
  duration: z.number().int().positive().max(600),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  calories: z.number().int().positive().max(5000),
  goal: z.enum(["weight-loss", "muscle-gain", "endurance"]),
  exercises: z.array(exerciseSchema).min(1).max(30),
})

export async function GET() {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  const result = await serverDatabases.listDocuments(DATABASE_ID, WORKOUTS_COLLECTION_ID, [Query.limit(200)])
  return NextResponse.json({ workouts: result.documents })
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  const body = await req.json().catch(() => null)
  const parsed = workoutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the workout fields." }, { status: 400 })
  }

  const { exercises, ...rest } = parsed.data
  const exercisesJson = JSON.stringify(exercises)
  if (exercisesJson.length > 5000) {
    return NextResponse.json({ error: "Too many exercises — reduce the exercise list." }, { status: 400 })
  }

  const workout = await serverDatabases.createDocument(DATABASE_ID, WORKOUTS_COLLECTION_ID, ID.unique(), {
    ...rest,
    exercisesJson,
  })

  return NextResponse.json({ success: true, workout })
}
