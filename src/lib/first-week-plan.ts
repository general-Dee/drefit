// Deterministic first-week plan builder. Same inputs -> same plan. It only
// selects and schedules existing coach-created workouts and diet plans using
// fixed rules (no AI involved).
import { addDaysToKey } from "@/lib/lagos-time"
import type { DietaryPreference, FitnessGoal, FitnessLevel } from "@/lib/db/schema"

export const PLAN_RULES_VERSION = 1

export type Equipment = "none" | "home" | "gym"
export const LIMITATIONS = ["knee", "lower-back", "shoulder", "wrist", "low-impact"] as const
export type Limitation = (typeof LIMITATIONS)[number]

export interface PlanProfile {
  fitnessGoal: FitnessGoal
  fitnessLevel: FitnessLevel
  daysPerWeek: number
  equipment: Equipment
  limitations: Limitation[]
  dietaryPreference: DietaryPreference
}

export interface PlanWorkoutInput {
  $id: string
  name: string
  muscleGroup: string
  duration: number
  difficulty: string
  goal: string
  exercisesJson: string
}

export interface PlanDietInput {
  $id: string
  dietaryPreference: string
  day: string
  breakfast: string
  lunch: string
  dinner: string
  snack: string
}

export interface PlanDay {
  day: number
  date: string
  weekday: string
  type: "workout" | "rest" | "mobility"
  workout?: { id: string; name: string; muscleGroup: string; duration: number; difficulty: string }
  meals?: { breakfast: string; lunch: string; dinner: string; snack: string }
}

export interface FirstWeekPlan {
  version: number
  startDate: string
  days: PlanDay[]
  workoutDays: number
  totalMinutes: number
  notes: string[]
}

// Spread of training days across 7 days (0 = day 1) with rest in between.
const TRAINING_PATTERNS: Record<number, number[]> = {
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 4, 5],
  6: [0, 1, 2, 3, 4, 5],
}

const EQUIPMENT_RANK: Record<Equipment, number> = { none: 0, home: 1, gym: 2 }
const LEVEL_RANK: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 }
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const GYM_KEYWORDS = /barbell|bench|deadlift|machine|cable|leg press|lat pulldown|smith|treadmill|rowing machine/i
const HOME_KEYWORDS = /dumbbell|kettlebell|resistance band|\bband\b|skipping rope|jump rope|pull-?up bar/i

// Exercises to avoid per limitation (by name keyword).
const LIMITATION_KEYWORDS: Record<Limitation, RegExp> = {
  knee: /squat|lunge|jump|burpee|sprint|high knees|leg press|step-?up|box/i,
  "lower-back": /deadlift|good morning|leg raise|burpee|row\b|superman/i,
  shoulder: /press|push-?up|overhead|dip|pull-?up|handstand/i,
  wrist: /push-?up|plank|burpee|mountain climber|handstand/i,
  "low-impact": /jump|burpee|sprint|high knees|run|jog|skipping/i,
}

function exerciseNames(w: PlanWorkoutInput): string[] {
  try {
    const list = JSON.parse(w.exercisesJson)
    return Array.isArray(list) ? list.map((e) => String(e?.name ?? "")) : []
  } catch {
    return []
  }
}

export function requiredEquipment(w: PlanWorkoutInput): Equipment {
  const text = [w.name, ...exerciseNames(w)].join(" | ")
  if (GYM_KEYWORDS.test(text)) return "gym"
  if (HOME_KEYWORDS.test(text)) return "home"
  return "none"
}

export function conflictsWithLimitations(w: PlanWorkoutInput, limitations: Limitation[]): boolean {
  const text = [w.name, ...exerciseNames(w)].join(" | ")
  return limitations.some((l) => LIMITATION_KEYWORDS[l]?.test(text))
}

export function scoreWorkout(w: PlanWorkoutInput, p: PlanProfile): number | null {
  if (EQUIPMENT_RANK[requiredEquipment(w)] > EQUIPMENT_RANK[p.equipment]) return null
  if (conflictsWithLimitations(w, p.limitations)) return null
  const gap = (LEVEL_RANK[w.difficulty] ?? 1) - (LEVEL_RANK[p.fitnessLevel] ?? 0)
  if (gap > 1) return null // never more than one level above the member
  let score = 0
  if (w.goal === p.fitnessGoal) score += 3
  if (gap === 0) score += 2
  else if (Math.abs(gap) === 1) score += 1
  return score
}

function weekdayOf(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number)
  const js = new Date(Date.UTC(y, m - 1, d)).getUTCDay() // 0 = Sunday
  return WEEKDAYS[(js + 6) % 7]
}

export function buildFirstWeekPlan(
  profile: PlanProfile,
  workouts: PlanWorkoutInput[],
  dietPlans: PlanDietInput[],
  startDate: string
): FirstWeekPlan {
  const days = Math.min(6, Math.max(2, Math.round(profile.daysPerWeek)))
  const pattern = TRAINING_PATTERNS[days]
  const notes: string[] = []

  const ranked = workouts
    .map((w) => ({ w, score: scoreWorkout(w, profile) }))
    .filter((x): x is { w: PlanWorkoutInput; score: number } => x.score !== null)
    .sort((a, b) => b.score - a.score || a.w.name.localeCompare(b.w.name) || a.w.$id.localeCompare(b.w.$id))
    .map((x) => x.w)

  if (ranked.length === 0) {
    notes.push("No workouts in the library match your equipment and limitations yet, so training days are gentle mobility sessions. Message your coach to tailor them.")
  } else if (ranked.length < pattern.length) {
    notes.push("Some workouts repeat this week while your coach adds more options for your setup.")
  }
  if (profile.limitations.length > 0) {
    notes.push("Workouts with movements that may aggravate your limitations were left out. Stop any exercise that causes pain and tell your coach.")
  }
  if (profile.fitnessLevel === "beginner") notes.push("Start at the lower end of each rep range and rest as long as you need.")

  // Diet: prefer the plan for the matching weekday, else cycle in order.
  const meals = dietPlans
    .filter((d) => d.dietaryPreference === profile.dietaryPreference)
    .sort((a, b) => {
      const ai = WEEKDAYS.indexOf(a.day), bi = WEEKDAYS.indexOf(b.day)
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi) || a.day.localeCompare(b.day) || a.$id.localeCompare(b.$id)
    })
  if (meals.length === 0) notes.push("Your coach hasn't published meal plans for your diet preference yet.")

  const out: PlanDay[] = []
  let pick = 0
  let lastGroup: string | null = null
  for (let i = 0; i < 7; i++) {
    const date = addDaysToKey(startDate, i)
    const weekday = weekdayOf(date)
    const day: PlanDay = { day: i + 1, date, weekday, type: "rest" }

    if (pattern.includes(i)) {
      if (ranked.length === 0) {
        day.type = "mobility"
      } else {
        // Round-robin, skipping a back-to-back repeat of the same muscle
        // group when another option exists.
        let choice = ranked[pick % ranked.length]
        if (ranked.length > 1 && choice.muscleGroup === lastGroup) {
          const alt = ranked.find((w, idx) => idx !== pick % ranked.length && w.muscleGroup !== lastGroup)
          if (alt) choice = alt
        }
        pick += 1
        lastGroup = choice.muscleGroup
        day.type = "workout"
        day.workout = { id: choice.$id, name: choice.name, muscleGroup: choice.muscleGroup, duration: choice.duration, difficulty: choice.difficulty }
      }
    } else {
      lastGroup = null
    }

    if (meals.length > 0) {
      const m = meals.find((d) => d.day === weekday) ?? meals[i % meals.length]
      day.meals = { breakfast: m.breakfast, lunch: m.lunch, dinner: m.dinner, snack: m.snack }
    }
    out.push(day)
  }

  const workoutDays = out.filter((d) => d.type !== "rest").length
  const totalMinutes = out.reduce((sum, d) => sum + (d.workout?.duration ?? (d.type === "mobility" ? 20 : 0)), 0)
  return { version: PLAN_RULES_VERSION, startDate, days: out, workoutDays, totalMinutes, notes }
}

export function parsePlan(json: string | null | undefined): FirstWeekPlan | null {
  if (!json) return null
  try {
    const p = JSON.parse(json)
    return p && Array.isArray(p.days) ? (p as FirstWeekPlan) : null
  } catch {
    return null
  }
}

export function planDayFor(plan: FirstWeekPlan | null, dateKey: string): PlanDay | null {
  return plan?.days.find((d) => d.date === dateKey) ?? null
}
