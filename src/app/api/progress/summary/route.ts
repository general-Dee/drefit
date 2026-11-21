import { NextResponse } from "next/server"
import { Query } from "node-appwrite"
import { requireMember } from "@/lib/member-guard"
import { serverDatabases } from "@/lib/appwrite/server"
import {
  DATABASE_ID,
  PROGRESS_LOGS_COLLECTION_ID,
  PROGRESS_PHOTOS_COLLECTION_ID,
  WORKOUT_COMPLETIONS_COLLECTION_ID,
  type ProgressLogDoc,
  type ProgressPhotoDoc,
  type WorkoutCompletionDoc,
} from "@/lib/appwrite/schema"
import { computeStreaks, summarizeWeights } from "@/lib/progress"

// Combined progress view: weight trend, photo timeline and streaks.
export async function GET() {
  const gate = await requireMember()
  if (gate.error) return gate.error
  const userId = gate.session.user.id

  const [logs, photos, completions] = await Promise.all([
    serverDatabases.listDocuments(DATABASE_ID, PROGRESS_LOGS_COLLECTION_ID, [
      Query.equal("userId", userId),
      Query.orderAsc("loggedAt"),
      Query.limit(500),
    ]),
    serverDatabases.listDocuments(DATABASE_ID, PROGRESS_PHOTOS_COLLECTION_ID, [
      Query.equal("userId", userId),
      Query.orderAsc("takenAt"),
      Query.limit(100),
    ]),
    serverDatabases.listDocuments(DATABASE_ID, WORKOUT_COMPLETIONS_COLLECTION_ID, [
      Query.equal("userId", userId),
      Query.orderDesc("completedAt"),
      Query.limit(1000),
    ]),
  ])

  const photoDocs = photos.documents as unknown as ProgressPhotoDoc[]
  return NextResponse.json({
    weight: summarizeWeights(logs.documents as unknown as ProgressLogDoc[]),
    photos: photoDocs.map((p) => ({ id: p.$id, fileId: p.fileId, takenAt: p.takenAt })),
    streaks: computeStreaks((completions.documents as unknown as WorkoutCompletionDoc[]).map((c) => c.completedAt), new Date()),
    totalWorkouts: completions.total,
  })
}
