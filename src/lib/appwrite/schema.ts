export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!
export const USERS_COLLECTION_ID = "users"
export const PROGRESS_LOGS_COLLECTION_ID = "progressLogs"
export const PROGRESS_PHOTOS_COLLECTION_ID = "progressPhotos"
export const PROGRESS_PHOTOS_BUCKET_ID = "progress-photos"
export const WORKOUTS_COLLECTION_ID = "workouts"
export const WORKOUT_COMPLETIONS_COLLECTION_ID = "workoutCompletions"
export const DIET_PLANS_COLLECTION_ID = "dietPlans"
export const COMMUNITY_POSTS_COLLECTION_ID = "communityPosts"
export const COMMUNITY_COMMENTS_COLLECTION_ID = "communityComments"

export type SubscriptionStatus = "trialing" | "active" | "inactive"

export type FitnessGoal = "weight-loss" | "muscle-gain" | "endurance"
export type FitnessLevel = "beginner" | "intermediate" | "advanced"
export type DietaryPreference = "omnivore" | "vegetarian" | "keto" | "halal"
export type Schedule = "morning" | "afternoon" | "evening"

// Attributes expected on documents in the `users` collection.
export interface AppwriteUserDoc {
  $id: string
  name: string
  email: string
  password: string
  role?: "admin" | "user"
  subscriptionStatus?: SubscriptionStatus
  subscriptionId?: string
  subscriptionCurrentPeriodEnd?: string
  trialEndsAt?: string
  fitnessGoal?: FitnessGoal
  fitnessLevel?: FitnessLevel
  dietaryPreference?: DietaryPreference
  schedule?: Schedule
  passwordResetTokenHash?: string
  passwordResetExpires?: string
  notificationsEnabled?: boolean
}

// Documents in the `progressLogs` collection.
export interface ProgressLogDoc {
  $id: string
  userId: string
  weight: number
  loggedAt: string
}

// Documents in the `progressPhotos` collection.
export interface ProgressPhotoDoc {
  $id: string
  userId: string
  fileId: string
  takenAt: string
}

export interface Exercise {
  name: string
  sets: number
  reps: number
  rest: number
}

// Documents in the `workouts` collection. Admin-curated content, managed via
// /admin/workouts (also seedable in bulk via scripts/seed-appwrite.mjs).
export interface WorkoutDoc {
  $id: string
  name: string
  muscleGroup: string
  duration: number
  difficulty: FitnessLevel
  calories: number
  goal: FitnessGoal
  // JSON-encoded Exercise[] — kept as a single string attribute since
  // Appwrite collections don't support nested object arrays.
  exercisesJson: string
}

// Documents in the `workoutCompletions` collection — one per finished workout.
export interface WorkoutCompletionDoc {
  $id: string
  userId: string
  workoutId: string
  completedAt: string
}

// Documents in the `dietPlans` collection. Admin-curated content, one
// document per (dietaryPreference, day) pair, managed via /admin/diet
// (also seedable in bulk via scripts/seed-appwrite.mjs).
export interface DietPlanDoc {
  $id: string
  dietaryPreference: DietaryPreference
  day: string
  breakfast: string
  lunch: string
  dinner: string
  snack: string
}

// Documents in the `communityPosts` collection.
export interface CommunityPostDoc {
  $id: string
  userId: string
  userName: string
  content: string
  likedBy: string[]
  createdAt: string
}

// Documents in the `communityComments` collection.
export interface CommunityCommentDoc {
  $id: string
  postId: string
  userId: string
  userName: string
  content: string
  createdAt: string
}
