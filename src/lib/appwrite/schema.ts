export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!
export const USERS_COLLECTION_ID = "users"
export const PROGRESS_LOGS_COLLECTION_ID = "progressLogs"
export const PROGRESS_PHOTOS_COLLECTION_ID = "progressPhotos"
export const PROGRESS_PHOTOS_BUCKET_ID = "progress-photos"

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
