// One-off provisioning script: creates the Appwrite collections/attributes/
// indexes/bucket this app expects (see src/lib/appwrite/schema.ts) and seeds
// sample workout/diet-plan content. Safe to re-run — every step checks for
// existing resources before creating them.
//
// Run with: node --env-file=.env.local scripts/seed-appwrite.mjs

import { Client, Databases, Storage, ID, Query, DatabasesIndexType, OrderBy } from "node-appwrite"
import { ensureSecuritySchema } from "./appwrite-security-schema.mjs"
import { ensureUpgradesSchema } from "./appwrite-upgrades-schema.mjs"

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY)

const databases = new Databases(client)
const storage = new Storage(client)

function isConflict(err) {
  return err?.code === 409
}

async function ensureCollection(collectionId, name) {
  try {
    await databases.createCollection({ databaseId: DATABASE_ID, collectionId, name })
    console.log(`created collection ${collectionId}`)
  } catch (err) {
    if (!isConflict(err)) throw err
    console.log(`collection ${collectionId} already exists`)
  }
}

async function ensureStringAttr(collectionId, key, size, required, opts = {}) {
  try {
    await databases.createStringAttribute({
      databaseId: DATABASE_ID,
      collectionId,
      key,
      size,
      required,
      xdefault: opts.xdefault,
      array: opts.array ?? false,
    })
    console.log(`  + string attr ${collectionId}.${key}`)
  } catch (err) {
    if (!isConflict(err)) throw err
  }
}

async function ensureFloatAttr(collectionId, key, required) {
  try {
    await databases.createFloatAttribute({ databaseId: DATABASE_ID, collectionId, key, required })
    console.log(`  + float attr ${collectionId}.${key}`)
  } catch (err) {
    if (!isConflict(err)) throw err
  }
}

async function ensureIntegerAttr(collectionId, key, required) {
  try {
    await databases.createIntegerAttribute({ databaseId: DATABASE_ID, collectionId, key, required })
    console.log(`  + integer attr ${collectionId}.${key}`)
  } catch (err) {
    if (!isConflict(err)) throw err
  }
}

async function ensureDatetimeAttr(collectionId, key, required) {
  try {
    await databases.createDatetimeAttribute({ databaseId: DATABASE_ID, collectionId, key, required })
    console.log(`  + datetime attr ${collectionId}.${key}`)
  } catch (err) {
    if (!isConflict(err)) throw err
  }
}

async function ensureBooleanAttr(collectionId, key, required, xdefault) {
  try {
    await databases.createBooleanAttribute({ databaseId: DATABASE_ID, collectionId, key, required, xdefault })
    console.log(`  + boolean attr ${collectionId}.${key}`)
  } catch (err) {
    if (!isConflict(err)) throw err
  }
}

async function waitForAttributes(collectionId, keys) {
  const deadline = Date.now() + 30_000
  for (const key of keys) {
    while (true) {
      const attr = await databases.getAttribute({ databaseId: DATABASE_ID, collectionId, key })
      if (attr.status === "available") break
      if (Date.now() > deadline) throw new Error(`Timed out waiting for ${collectionId}.${key}`)
      await new Promise((r) => setTimeout(r, 750))
    }
  }
}

async function ensureIndex(collectionId, key, attributes, orders) {
  try {
    await databases.createIndex({
      databaseId: DATABASE_ID,
      collectionId,
      key,
      type: DatabasesIndexType.Key,
      attributes,
      orders,
    })
    console.log(`  + index ${collectionId}.${key}`)
  } catch (err) {
    if (!isConflict(err)) throw err
  }
}

let bucketWarning = null

async function ensureBucket(bucketId, name) {
  try {
    await storage.createBucket({
      bucketId,
      name,
      maximumFileSize: 5 * 1024 * 1024,
      allowedFileExtensions: ["jpg", "jpeg", "png", "webp"],
    })
    console.log(`created bucket ${bucketId}`)
  } catch (err) {
    if (isConflict(err)) {
      console.log(`bucket ${bucketId} already exists`)
      return
    }
    // Don't let a missing storage scope on the API key block the rest of
    // the provisioning/seeding — surface it as a warning instead.
    bucketWarning = err.message ?? String(err)
    console.warn(`WARNING: could not create bucket ${bucketId}: ${bucketWarning}`)
  }
}

async function docCount(collectionId, queries = []) {
  const result = await databases.listDocuments(DATABASE_ID, collectionId, [...queries, Query.limit(1)])
  return result.total
}

async function main() {
  console.log(`Provisioning Appwrite resources in database ${DATABASE_ID}...\n`)

  // --- progressLogs ---
  await ensureCollection("progressLogs", "Progress Logs")
  await ensureStringAttr("progressLogs", "userId", 255, true)
  await ensureFloatAttr("progressLogs", "weight", true)
  await ensureDatetimeAttr("progressLogs", "loggedAt", true)
  await waitForAttributes("progressLogs", ["userId", "weight", "loggedAt"])
  await ensureIndex("progressLogs", "userId_loggedAt", ["userId", "loggedAt"], [OrderBy.Asc, OrderBy.Desc])

  // --- progressPhotos ---
  await ensureCollection("progressPhotos", "Progress Photos")
  await ensureStringAttr("progressPhotos", "userId", 255, true)
  await ensureStringAttr("progressPhotos", "fileId", 255, true)
  await ensureDatetimeAttr("progressPhotos", "takenAt", true)
  await waitForAttributes("progressPhotos", ["userId", "fileId", "takenAt"])
  await ensureIndex("progressPhotos", "userId_takenAt", ["userId", "takenAt"], [OrderBy.Asc, OrderBy.Desc])

  // --- users.notificationsEnabled ---
  await ensureBooleanAttr("users", "notificationsEnabled", false, true)

  // --- workouts ---
  await ensureCollection("workouts", "Workouts")
  await ensureStringAttr("workouts", "name", 255, true)
  await ensureStringAttr("workouts", "muscleGroup", 255, true)
  await ensureIntegerAttr("workouts", "duration", true)
  await ensureStringAttr("workouts", "difficulty", 50, true)
  await ensureIntegerAttr("workouts", "calories", true)
  await ensureStringAttr("workouts", "goal", 50, true)
  await ensureStringAttr("workouts", "exercisesJson", 5000, true)
  await waitForAttributes("workouts", ["name", "muscleGroup", "duration", "difficulty", "calories", "goal", "exercisesJson"])
  await ensureIndex("workouts", "goal_idx", ["goal"], [OrderBy.Asc])

  // --- workoutCompletions ---
  await ensureCollection("workoutCompletions", "Workout Completions")
  await ensureStringAttr("workoutCompletions", "userId", 255, true)
  await ensureStringAttr("workoutCompletions", "workoutId", 255, true)
  await ensureDatetimeAttr("workoutCompletions", "completedAt", true)
  await waitForAttributes("workoutCompletions", ["userId", "workoutId", "completedAt"])
  await ensureIndex("workoutCompletions", "userId_workoutId", ["userId", "workoutId"], [OrderBy.Asc, OrderBy.Asc])

  // --- dietPlans ---
  await ensureCollection("dietPlans", "Diet Plans")
  await ensureStringAttr("dietPlans", "dietaryPreference", 50, true)
  await ensureStringAttr("dietPlans", "day", 50, true)
  await ensureStringAttr("dietPlans", "breakfast", 500, true)
  await ensureStringAttr("dietPlans", "lunch", 500, true)
  await ensureStringAttr("dietPlans", "dinner", 500, true)
  await ensureStringAttr("dietPlans", "snack", 500, true)
  await waitForAttributes("dietPlans", ["dietaryPreference", "day", "breakfast", "lunch", "dinner", "snack"])
  await ensureIndex("dietPlans", "dietaryPreference_idx", ["dietaryPreference"], [OrderBy.Asc])

  // --- communityPosts ---
  await ensureCollection("communityPosts", "Community Posts")
  await ensureStringAttr("communityPosts", "userId", 255, true)
  await ensureStringAttr("communityPosts", "userName", 255, true)
  await ensureStringAttr("communityPosts", "content", 1000, true)
  await ensureStringAttr("communityPosts", "likedBy", 255, false, { array: true })
  await ensureDatetimeAttr("communityPosts", "createdAt", true)
  await waitForAttributes("communityPosts", ["userId", "userName", "content", "likedBy", "createdAt"])
  await ensureIndex("communityPosts", "createdAt_idx", ["createdAt"], [OrderBy.Desc])

  // --- communityComments ---
  await ensureCollection("communityComments", "Community Comments")
  await ensureStringAttr("communityComments", "postId", 255, true)
  await ensureStringAttr("communityComments", "userId", 255, true)
  await ensureStringAttr("communityComments", "userName", 255, true)
  await ensureStringAttr("communityComments", "content", 500, true)
  await ensureDatetimeAttr("communityComments", "createdAt", true)
  await waitForAttributes("communityComments", ["postId", "userId", "userName", "content", "createdAt"])
  await ensureIndex("communityComments", "postId_createdAt", ["postId", "createdAt"], [OrderBy.Asc, OrderBy.Asc])

  // --- coachingMessages ---
  await ensureCollection("coachingMessages", "Coaching Messages")
  await ensureStringAttr("coachingMessages", "userId", 255, true)
  await ensureStringAttr("coachingMessages", "senderId", 255, true)
  await ensureStringAttr("coachingMessages", "senderName", 255, true)
  await ensureBooleanAttr("coachingMessages", "isFromAdmin", true)
  await ensureStringAttr("coachingMessages", "content", 2000, true)
  await ensureDatetimeAttr("coachingMessages", "createdAt", true)
  await waitForAttributes("coachingMessages", ["userId", "senderId", "senderName", "isFromAdmin", "content", "createdAt"])
  await ensureIndex("coachingMessages", "userId_createdAt", ["userId", "createdAt"], [OrderBy.Asc, OrderBy.Asc])
  await ensureIndex("coachingMessages", "createdAt_idx", ["createdAt"], [OrderBy.Desc])

  // --- loginAttempts + paymentEvents (security) ---
  await ensureSecuritySchema(databases, DATABASE_ID)
  await ensureUpgradesSchema(databases, DATABASE_ID)

  // --- progress-photos bucket ---
  await ensureBucket("progress-photos", "Progress Photos")

  console.log("\nSchema provisioning done. Seeding sample content...\n")

  // --- Seed workouts (only if the library is empty) ---
  if ((await docCount("workouts")) === 0) {
    const workouts = [
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
    for (const w of workouts) {
      await databases.createDocument(DATABASE_ID, "workouts", ID.unique(), w)
    }
    console.log(`seeded ${workouts.length} workouts`)
  } else {
    console.log("workouts already has content, skipping seed")
  }

  // --- Seed diet plans (only if empty) ---
  if ((await docCount("dietPlans")) === 0) {
    const dietPlans = [
      { dietaryPreference: "omnivore", day: "Monday", breakfast: "Oatmeal with Banana", lunch: "Grilled Chicken & Jollof Rice", dinner: "Suya Wrap", snack: "Mixed Nuts" },
      { dietaryPreference: "omnivore", day: "Tuesday", breakfast: "Smoothie Bowl", lunch: "Moi Moi with Fish Stew", dinner: "Vegetable Stir-fry", snack: "Greek Yogurt" },
      { dietaryPreference: "vegetarian", day: "Monday", breakfast: "Oatmeal with Banana", lunch: "Jollof Rice with Fried Plantain", dinner: "Vegetable Egusi (no meat)", snack: "Mixed Nuts" },
      { dietaryPreference: "vegetarian", day: "Tuesday", breakfast: "Smoothie Bowl", lunch: "Moi Moi with Vegetable Sauce", dinner: "Vegetable Stir-fry", snack: "Greek Yogurt" },
      { dietaryPreference: "keto", day: "Monday", breakfast: "Scrambled Eggs with Avocado", lunch: "Grilled Chicken with Sauteed Greens", dinner: "Suya (no bread)", snack: "Almonds" },
      { dietaryPreference: "keto", day: "Tuesday", breakfast: "Bulletproof Coffee & Eggs", lunch: "Fish Stew (no swallow)", dinner: "Zucchini Stir-fry with Beef", snack: "Cheese Cubes" },
      { dietaryPreference: "halal", day: "Monday", breakfast: "Oatmeal with Banana", lunch: "Grilled Chicken & Jollof Rice", dinner: "Beef Suya Wrap", snack: "Mixed Nuts" },
      { dietaryPreference: "halal", day: "Tuesday", breakfast: "Smoothie Bowl", lunch: "Moi Moi with Fish Stew", dinner: "Vegetable Stir-fry with Chicken", snack: "Greek Yogurt" },
    ]
    for (const d of dietPlans) {
      await databases.createDocument(DATABASE_ID, "dietPlans", ID.unique(), d)
    }
    console.log(`seeded ${dietPlans.length} diet plan days`)
  } else {
    console.log("dietPlans already has content, skipping seed")
  }

  console.log("\nAll done.")
  if (bucketWarning) {
    console.warn(`\nNOTE: the progress-photos bucket was NOT created (${bucketWarning}).`)
    console.warn("Add the 'buckets.write' scope to this API key in the Appwrite console, then re-run this script.")
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
