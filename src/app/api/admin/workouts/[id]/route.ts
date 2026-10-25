import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/admin-guard"
import { db } from "@/lib/db/client"
import { WORKOUTS_COLLECTION_ID } from "@/lib/db/schema"

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

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  const workout = await db
    .getDocument(WORKOUTS_COLLECTION_ID, params.id)
    .catch(() => null)

  if (!workout) {
    return NextResponse.json({ error: "Workout not found" }, { status: 404 })
  }

  return NextResponse.json({ workout })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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

  const workout = await db
    .updateDocument(WORKOUTS_COLLECTION_ID, params.id, { ...rest, exercisesJson })
    .catch(() => null)

  if (!workout) {
    return NextResponse.json({ error: "Workout not found" }, { status: 404 })
  }

  return NextResponse.json({ success: true, workout })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  await db.deleteDocument(WORKOUTS_COLLECTION_ID, params.id).catch(() => null)

  return NextResponse.json({ success: true })
}
