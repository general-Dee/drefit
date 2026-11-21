import { Query } from "node-appwrite"
import { serverDatabases } from "@/lib/appwrite/server"
import {
  DATABASE_ID,
  DIET_PLANS_COLLECTION_ID,
  FIRST_WEEK_PLANS_COLLECTION_ID,
  WORKOUTS_COLLECTION_ID,
  type FirstWeekPlanDoc,
} from "@/lib/appwrite/schema"
import { buildFirstWeekPlan, parsePlan, PLAN_RULES_VERSION, type FirstWeekPlan, type PlanDietInput, type PlanProfile, type PlanWorkoutInput } from "@/lib/first-week-plan"

export async function generateAndSaveFirstWeek(userId: string, profile: PlanProfile, startDate: string): Promise<FirstWeekPlan> {
  const [workouts, diets] = await Promise.all([
    serverDatabases.listDocuments(DATABASE_ID, WORKOUTS_COLLECTION_ID, [Query.limit(100)]),
    serverDatabases.listDocuments(DATABASE_ID, DIET_PLANS_COLLECTION_ID, [Query.equal("dietaryPreference", profile.dietaryPreference), Query.limit(100)]),
  ])
  const plan = buildFirstWeekPlan(
    profile,
    workouts.documents as unknown as PlanWorkoutInput[],
    diets.documents as unknown as PlanDietInput[],
    startDate
  )
  const data = { userId, planJson: JSON.stringify(plan), rulesVersion: PLAN_RULES_VERSION, generatedAt: new Date().toISOString() }
  try {
    await serverDatabases.createDocument(DATABASE_ID, FIRST_WEEK_PLANS_COLLECTION_ID, userId, data)
  } catch (err) {
    if ((err as { code?: number })?.code !== 409) throw err
    await serverDatabases.updateDocument(DATABASE_ID, FIRST_WEEK_PLANS_COLLECTION_ID, userId, data)
  }
  return plan
}

export async function loadFirstWeek(userId: string): Promise<FirstWeekPlan | null> {
  try {
    const doc = (await serverDatabases.getDocument(DATABASE_ID, FIRST_WEEK_PLANS_COLLECTION_ID, userId)) as unknown as FirstWeekPlanDoc
    return parsePlan(doc.planJson)
  } catch (err) {
    if ((err as { code?: number })?.code === 404) return null
    throw err
  }
}
