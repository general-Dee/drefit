import { Query } from "@/lib/db/query"
import { db } from "@/lib/db/client"
import {
  DIET_PLANS_COLLECTION_ID,
  FIRST_WEEK_PLANS_COLLECTION_ID,
  WORKOUTS_COLLECTION_ID,
  type FirstWeekPlanDoc,
} from "@/lib/db/schema"
import { buildFirstWeekPlan, parsePlan, PLAN_RULES_VERSION, type FirstWeekPlan, type PlanDietInput, type PlanProfile, type PlanWorkoutInput } from "@/lib/first-week-plan"

export async function generateAndSaveFirstWeek(userId: string, profile: PlanProfile, startDate: string): Promise<FirstWeekPlan> {
  const [workouts, diets] = await Promise.all([
    db.listDocuments(WORKOUTS_COLLECTION_ID, [Query.limit(100)]),
    db.listDocuments(DIET_PLANS_COLLECTION_ID, [Query.equal("dietaryPreference", profile.dietaryPreference), Query.limit(100)]),
  ])
  const plan = buildFirstWeekPlan(
    profile,
    workouts.documents as unknown as PlanWorkoutInput[],
    diets.documents as unknown as PlanDietInput[],
    startDate
  )
  const data = { userId, planJson: JSON.stringify(plan), rulesVersion: PLAN_RULES_VERSION, generatedAt: new Date().toISOString() }
  try {
    await db.createDocument(FIRST_WEEK_PLANS_COLLECTION_ID, userId, data)
  } catch (err) {
    if ((err as { code?: number })?.code !== 409) throw err
    await db.updateDocument(FIRST_WEEK_PLANS_COLLECTION_ID, userId, data)
  }
  return plan
}

export async function loadFirstWeek(userId: string): Promise<FirstWeekPlan | null> {
  try {
    const doc = (await db.getDocument(FIRST_WEEK_PLANS_COLLECTION_ID, userId)) as unknown as FirstWeekPlanDoc
    return parsePlan(doc.planJson)
  } catch (err) {
    if ((err as { code?: number })?.code === 404) return null
    throw err
  }
}
