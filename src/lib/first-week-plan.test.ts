import { describe, it, expect } from "vitest"
import {
  buildFirstWeekPlan,
  conflictsWithLimitations,
  requiredEquipment,
  scoreWorkout,
  type PlanDietInput,
  type PlanProfile,
  type PlanWorkoutInput,
} from "./first-week-plan"

const ex = (...names: string[]) => JSON.stringify(names.map((name) => ({ name, sets: 3, reps: 10, rest: 60 })))
// Mirrors the seeded library in scripts/seed-appwrite.mjs.
const LIBRARY: PlanWorkoutInput[] = [
  { $id: "w1", name: "Upper Body Strength", muscleGroup: "Upper Body", duration: 45, difficulty: "intermediate", goal: "muscle-gain", exercisesJson: ex("Push-Ups", "Dumbbell Press", "Incline Push-Ups") },
  { $id: "w2", name: "Leg Day Blast", muscleGroup: "Lower Body", duration: 50, difficulty: "advanced", goal: "muscle-gain", exercisesJson: ex("Squats", "Lunges", "Leg Press") },
  { $id: "w3", name: "Core Crusher", muscleGroup: "Core", duration: 30, difficulty: "beginner", goal: "weight-loss", exercisesJson: ex("Plank", "Crunches", "Leg Raises") },
  { $id: "w4", name: "Fat-Burn Circuit", muscleGroup: "Full Body", duration: 40, difficulty: "beginner", goal: "weight-loss", exercisesJson: ex("Jumping Jacks", "Burpees", "Mountain Climbers") },
  { $id: "w5", name: "Endurance Run Prep", muscleGroup: "Cardio", duration: 35, difficulty: "intermediate", goal: "endurance", exercisesJson: ex("High Knees", "Interval Sprints", "Cool-down Jog") },
]
const DIETS: PlanDietInput[] = ["Wednesday", "Monday", "Tuesday"].map((day, i) => ({
  $id: `d${i}`, dietaryPreference: "omnivore", day, breakfast: `B-${day}`, lunch: `L-${day}`, dinner: `D-${day}`, snack: `S-${day}`,
}))
const profile = (o: Partial<PlanProfile> = {}): PlanProfile => ({
  fitnessGoal: "weight-loss", fitnessLevel: "beginner", daysPerWeek: 3, equipment: "none", limitations: [], dietaryPreference: "omnivore", ...o,
})
const START = "2026-10-19" // a Monday

describe("workout rules", () => {
  it("infers equipment from exercises", () => {
    expect(requiredEquipment(LIBRARY[0])).toBe("home") // dumbbell
    expect(requiredEquipment(LIBRARY[1])).toBe("gym") // leg press
    expect(requiredEquipment(LIBRARY[2])).toBe("none")
  })
  it("flags limitation conflicts", () => {
    expect(conflictsWithLimitations(LIBRARY[1], ["knee"])).toBe(true)
    expect(conflictsWithLimitations(LIBRARY[3], ["low-impact"])).toBe(true)
    expect(conflictsWithLimitations(LIBRARY[2], ["knee"])).toBe(false)
  })
  it("never schedules more than one level above the member", () => {
    expect(scoreWorkout(LIBRARY[1], profile({ equipment: "gym", fitnessLevel: "beginner" }))).toBeNull()
    expect(scoreWorkout(LIBRARY[1], profile({ equipment: "gym", fitnessLevel: "intermediate" }))).not.toBeNull()
  })
})

describe("buildFirstWeekPlan", () => {
  it("is deterministic", () => {
    const a = buildFirstWeekPlan(profile(), LIBRARY, DIETS, START)
    const b = buildFirstWeekPlan(profile(), [...LIBRARY].reverse(), [...DIETS].reverse(), START)
    expect(a).toEqual(b)
  })

  it.each([2, 3, 4, 5, 6])("schedules %i training days over 7 days", (n) => {
    const plan = buildFirstWeekPlan(profile({ daysPerWeek: n }), LIBRARY, DIETS, START)
    expect(plan.days).toHaveLength(7)
    expect(plan.days.filter((d) => d.type === "workout")).toHaveLength(n)
    expect(plan.days.some((d) => d.type === "rest")).toBe(true)
  })

  it("clamps days per week to 2..6", () => {
    expect(buildFirstWeekPlan(profile({ daysPerWeek: 7 }), LIBRARY, DIETS, START).workoutDays).toBe(6)
    expect(buildFirstWeekPlan(profile({ daysPerWeek: 1 }), LIBRARY, DIETS, START).workoutDays).toBe(2)
  })

  it("prefers the member's goal and level, within equipment", () => {
    const plan = buildFirstWeekPlan(profile({ fitnessGoal: "weight-loss", fitnessLevel: "beginner", daysPerWeek: 2 }), LIBRARY, DIETS, START)
    const ids = plan.days.filter((d) => d.workout).map((d) => d.workout!.id)
    expect(ids.every((id) => ["w3", "w4"].includes(id))).toBe(true)
    // no-equipment member never gets dumbbell or gym workouts
    const all = buildFirstWeekPlan(profile({ daysPerWeek: 6 }), LIBRARY, DIETS, START)
    expect(all.days.some((d) => d.workout && ["w1", "w2"].includes(d.workout.id))).toBe(false)
  })

  it("respects limitations and falls back to mobility when nothing fits", () => {
    const kneePlan = buildFirstWeekPlan(profile({ limitations: ["knee"], daysPerWeek: 4 }), LIBRARY, DIETS, START)
    expect(kneePlan.days.some((d) => d.workout?.id === "w4")).toBe(false) // burpees
    const none = buildFirstWeekPlan(profile({ limitations: ["knee", "wrist", "lower-back", "low-impact"] }), LIBRARY, DIETS, START)
    expect(none.days.filter((d) => d.type === "mobility")).toHaveLength(3)
    expect(none.notes.join(" ")).toMatch(/coach/i)
  })

  it("avoids the same muscle group on back-to-back training days when possible", () => {
    const plan = buildFirstWeekPlan(profile({ daysPerWeek: 6, equipment: "gym", fitnessLevel: "intermediate", fitnessGoal: "muscle-gain" }), LIBRARY, DIETS, START)
    const groups = plan.days.map((d) => d.workout?.muscleGroup ?? null)
    for (let i = 1; i < groups.length; i++) if (groups[i] && groups[i - 1]) expect(groups[i]).not.toBe(groups[i - 1])
  })

  it("matches diet plans by weekday, cycling when a day is missing", () => {
    const plan = buildFirstWeekPlan(profile(), LIBRARY, DIETS, START)
    expect(plan.days[0]).toMatchObject({ weekday: "Monday", meals: { breakfast: "B-Monday" } })
    expect(plan.days[2]).toMatchObject({ weekday: "Wednesday", meals: { breakfast: "B-Wednesday" } })
    expect(plan.days[3].meals).toBeDefined() // Thursday cycles through available plans
    const noDiet = buildFirstWeekPlan(profile({ dietaryPreference: "keto" }), LIBRARY, DIETS, START)
    expect(noDiet.days[0].meals).toBeUndefined()
  })

  it("dates and totals are correct", () => {
    const plan = buildFirstWeekPlan(profile({ daysPerWeek: 3 }), LIBRARY, DIETS, "2026-10-30")
    expect(plan.days.map((d) => d.date)).toEqual(["2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05"])
    expect(plan.totalMinutes).toBe(plan.days.reduce((s, d) => s + (d.workout?.duration ?? 0), 0))
  })
})
