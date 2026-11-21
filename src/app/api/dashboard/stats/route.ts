import { NextResponse } from "next/server"
import { Query } from "node-appwrite"
import { computeStreaks } from "@/lib/progress"
import { lagosDateKey } from "@/lib/lagos-time"
import { requireMember } from "@/lib/member-guard"
import { serverDatabases } from "@/lib/appwrite/server"
import {
  DATABASE_ID,
  WORKOUT_COMPLETIONS_COLLECTION_ID,
  WORKOUTS_COLLECTION_ID,
  PROGRESS_LOGS_COLLECTION_ID,
  type WorkoutCompletionDoc,
  type WorkoutDoc,
  type ProgressLogDoc,
} from "@/lib/appwrite/schema"

const WEEKLY_WORKOUT_GOAL = 7

export async function GET() {
  const gate = await requireMember()
  if (gate.error) return gate.error
  const session = gate.session
  const userId = session.user.id

  const [completionsResult, logsResult] = await Promise.all([
    serverDatabases.listDocuments(DATABASE_ID, WORKOUT_COMPLETIONS_COLLECTION_ID, [
      Query.equal("userId", userId),
      Query.orderDesc("completedAt"),
      Query.limit(500),
    ]),
    serverDatabases.listDocuments(DATABASE_ID, PROGRESS_LOGS_COLLECTION_ID, [
      Query.equal("userId", userId),
      Query.orderAsc("loggedAt"),
      Query.limit(500),
    ]),
  ])

  const completions = completionsResult.documents as unknown as WorkoutCompletionDoc[]
  const logs = logsResult.documents as unknown as ProgressLogDoc[]

  const workoutIds = [...new Set(completions.map((c) => c.workoutId))]
  const caloriesByWorkoutId = new Map<string, number>()
  if (workoutIds.length > 0) {
    const workoutsResult = await serverDatabases.listDocuments(DATABASE_ID, WORKOUTS_COLLECTION_ID, [
      Query.equal("$id", workoutIds),
      Query.limit(workoutIds.length),
    ])
    for (const workout of workoutsResult.documents as unknown as WorkoutDoc[]) {
      caloriesByWorkoutId.set(workout.$id, workout.calories)
    }
  }

  const now = new Date()
  const todayKey = lagosDateKey(now)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  let caloriesToday = 0
  let workoutsThisWeek = 0

  for (const completion of completions) {
    const completedAt = new Date(completion.completedAt)
    if (lagosDateKey(completedAt) === todayKey) {
      caloriesToday += caloriesByWorkoutId.get(completion.workoutId) ?? 0
    }
    if (completedAt >= sevenDaysAgo) workoutsThisWeek += 1
  }

  // Lagos-calendar streak (shared with the progress dashboard).
  const streakDays = computeStreaks(completions.map((c) => c.completedAt), now).current

  const progressDeltaKg = logs.length >= 2 ? logs[logs.length - 1].weight - logs[0].weight : null

  return NextResponse.json({
    caloriesToday,
    workoutsThisWeek,
    weeklyGoal: WEEKLY_WORKOUT_GOAL,
    streakDays,
    progressDeltaKg,
  })
}
