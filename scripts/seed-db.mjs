// Seeds the sample workout library and diet plans (ported from the old
// scripts/seed-appwrite.mjs, same content). Each table is only seeded when it
// is empty, so re-running is safe. Applies the schema migrations first.
//
//   node --env-file=.env.local scripts/seed-db.mjs
//
// NOTE: Preview and Production share one Neon database. Only seed a database
// whose library is meant to hold this sample content.
import { randomBytes } from "node:crypto"
import { fileURLToPath } from "node:url"
import { connect, describeUrl, scriptDatabaseUrl } from "./lib/pg.mjs"
import { migrate } from "./migrate-db.mjs"

export const WORKOUTS = [
  {
    name: "Upper Body Strength",
    muscleGroup: "Upper Body",
    duration: 45,
    difficulty: "intermediate",
    calories: 350,
    goal: "muscle-gain",
    exercisesJson: JSON.stringify([
      { name: "Push-Ups", sets: 3, reps: 12, rest: 60 },
      { name: "Dumbbell Press", sets: 4, reps: 10, rest: 60 },
      { name: "Incline Push-Ups", sets: 3, reps: 10, rest: 45 },
    ]),
  },
  {
    name: "Leg Day Blast",
    muscleGroup: "Lower Body",
    duration: 50,
    difficulty: "advanced",
    calories: 450,
    goal: "muscle-gain",
    exercisesJson: JSON.stringify([
      { name: "Squats", sets: 4, reps: 12, rest: 90 },
      { name: "Lunges", sets: 3, reps: 12, rest: 60 },
      { name: "Leg Press", sets: 4, reps: 10, rest: 90 },
    ]),
  },
  {
    name: "Core Crusher",
    muscleGroup: "Core",
    duration: 30,
    difficulty: "beginner",
    calories: 200,
    goal: "weight-loss",
    exercisesJson: JSON.stringify([
      { name: "Plank", sets: 3, reps: 1, rest: 45 },
      { name: "Crunches", sets: 3, reps: 20, rest: 30 },
      { name: "Leg Raises", sets: 3, reps: 15, rest: 30 },
    ]),
  },
  {
    name: "Fat-Burn Circuit",
    muscleGroup: "Full Body",
    duration: 40,
    difficulty: "beginner",
    calories: 400,
    goal: "weight-loss",
    exercisesJson: JSON.stringify([
      { name: "Jumping Jacks", sets: 3, reps: 30, rest: 30 },
      { name: "Burpees", sets: 3, reps: 10, rest: 45 },
      { name: "Mountain Climbers", sets: 3, reps: 20, rest: 30 },
    ]),
  },
  {
    name: "Endurance Run Prep",
    muscleGroup: "Cardio",
    duration: 35,
    difficulty: "intermediate",
    calories: 300,
    goal: "endurance",
    exercisesJson: JSON.stringify([
      { name: "High Knees", sets: 4, reps: 30, rest: 30 },
      { name: "Interval Sprints", sets: 6, reps: 1, rest: 60 },
      { name: "Cool-down Jog", sets: 1, reps: 1, rest: 0 },
    ]),
  },
]

export const DIET_PLANS = [
  { dietaryPreference: "omnivore", day: "Monday", breakfast: "Oatmeal with Banana", lunch: "Grilled Chicken & Jollof Rice", dinner: "Suya Wrap", snack: "Mixed Nuts" },
  { dietaryPreference: "omnivore", day: "Tuesday", breakfast: "Smoothie Bowl", lunch: "Moi Moi with Fish Stew", dinner: "Vegetable Stir-fry", snack: "Greek Yogurt" },
  { dietaryPreference: "vegetarian", day: "Monday", breakfast: "Oatmeal with Banana", lunch: "Jollof Rice with Fried Plantain", dinner: "Vegetable Egusi (no meat)", snack: "Mixed Nuts" },
  { dietaryPreference: "vegetarian", day: "Tuesday", breakfast: "Smoothie Bowl", lunch: "Moi Moi with Vegetable Sauce", dinner: "Vegetable Stir-fry", snack: "Greek Yogurt" },
  { dietaryPreference: "keto", day: "Monday", breakfast: "Scrambled Eggs with Avocado", lunch: "Grilled Chicken with Sauteed Greens", dinner: "Suya (no bread)", snack: "Almonds" },
  { dietaryPreference: "keto", day: "Tuesday", breakfast: "Bulletproof Coffee & Eggs", lunch: "Fish Stew (no swallow)", dinner: "Zucchini Stir-fry with Beef", snack: "Cheese Cubes" },
  { dietaryPreference: "halal", day: "Monday", breakfast: "Oatmeal with Banana", lunch: "Grilled Chicken & Jollof Rice", dinner: "Beef Suya Wrap", snack: "Mixed Nuts" },
  { dietaryPreference: "halal", day: "Tuesday", breakfast: "Smoothie Bowl", lunch: "Moi Moi with Fish Stew", dinner: "Vegetable Stir-fry with Chicken", snack: "Greek Yogurt" },
]

const newId = () => randomBytes(10).toString("hex")

export async function seed(url = scriptDatabaseUrl(), log = console.log) {
  await migrate(url, { quiet: true })
  const client = await connect(url)
  try {
    const count = async (table) => (await client.query(`SELECT count(*)::int AS n FROM ${table}`)).rows[0].n
    if ((await count("workouts")) === 0) {
      for (const w of WORKOUTS) {
        await client.query(
          `INSERT INTO workouts (id, name, muscle_group, duration, difficulty, calories, goal, exercises_json)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [newId(), w.name, w.muscleGroup, w.duration, w.difficulty, w.calories, w.goal, w.exercisesJson]
        )
      }
      log(`seeded ${WORKOUTS.length} workouts`)
    } else {
      log("workouts already has content, skipping seed")
    }
    if ((await count("diet_plans")) === 0) {
      for (const d of DIET_PLANS) {
        await client.query(
          `INSERT INTO diet_plans (id, dietary_preference, day, breakfast, lunch, dinner, snack) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [newId(), d.dietaryPreference, d.day, d.breakfast, d.lunch, d.dinner, d.snack]
        )
      }
      log(`seeded ${DIET_PLANS.length} diet plan days`)
    } else {
      log("dietPlans already has content, skipping seed")
    }
  } finally {
    await client.end()
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  const url = scriptDatabaseUrl()
  if (!url) {
    console.error("DATABASE_URL is not set")
    process.exit(1)
  }
  console.log(`[seed-db] target ${describeUrl(url)}`)
  seed(url).then(
    () => console.log("[seed-db] done"),
    (err) => {
      console.error(err)
      process.exit(1)
    }
  )
}
