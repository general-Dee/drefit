// Collection names (logical). Each maps to a Postgres table in src/lib/db/collections.json
// (e.g. progressLogs -> progress_logs); the SQL lives in db/migrations/.
export const USERS_COLLECTION_ID = "users"
export const PROGRESS_LOGS_COLLECTION_ID = "progressLogs"
export const PROGRESS_PHOTOS_COLLECTION_ID = "progressPhotos"
// Pathname prefix for progress photos in the private Vercel Blob store.
export const PROGRESS_PHOTOS_BLOB_PREFIX = "progress-photos"
export const WORKOUTS_COLLECTION_ID = "workouts"
export const WORKOUT_COMPLETIONS_COLLECTION_ID = "workoutCompletions"
export const DIET_PLANS_COLLECTION_ID = "dietPlans"
export const COMMUNITY_POSTS_COLLECTION_ID = "communityPosts"
export const COMMUNITY_COMMENTS_COLLECTION_ID = "communityComments"
export const COACHING_MESSAGES_COLLECTION_ID = "coachingMessages"

export type SubscriptionStatus = "trialing" | "active" | "inactive"

export type FitnessGoal = "weight-loss" | "muscle-gain" | "endurance"
export type FitnessLevel = "beginner" | "intermediate" | "advanced"
export type DietaryPreference = "omnivore" | "vegetarian" | "keto" | "halal"
export type Schedule = "morning" | "afternoon" | "evening"

// Attributes expected on documents in the `users` collection.
export interface UserDoc {
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
  // WhatsApp reminders (E.164 phone, explicit opt-in, Lagos hour 0-23)
  phone?: string | null
  whatsappOptIn?: boolean | null
  reminderHour?: number | null
  // Referrals: this user's share code and the referrer's user $id
  referralCode?: string | null
  referredBy?: string | null
  // Onboarding (upgrade 5)
  daysPerWeek?: number | null
  equipment?: "none" | "home" | "gym" | null
  limitationsJson?: string | null
  limitationsNote?: string | null
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
  // Vercel Blob pathname (private store); null until a migrated photo is re-uploaded
  blobPathname?: string | null
  contentType?: string | null
}

export interface Exercise {
  name: string
  sets: number
  reps: number
  rest: number
}

// Documents in the `workouts` collection. Admin-curated content, managed via
// /admin/workouts (also seedable in bulk via scripts/seed-db.mjs).
export interface WorkoutDoc {
  $id: string
  name: string
  muscleGroup: string
  duration: number
  difficulty: FitnessLevel
  calories: number
  goal: FitnessGoal
  // JSON-encoded Exercise[] — kept as a single string attribute since
  // Stored as JSON text (kept from the Appwrite era; the app parses it).
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
// (also seedable in bulk via scripts/seed-db.mjs).
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

// Documents in the `coachingMessages` collection. Each member has exactly one
// implicit thread with "the coaching team" (any admin) — `userId` is always
// the member the thread belongs to, regardless of who sent a given message.
export interface CoachingMessageDoc {
  $id: string
  userId: string
  senderId: string
  senderName: string
  isFromAdmin: boolean
  content: string
  createdAt: string
}

// Security tables (db/migrations/, applied before `next build` by scripts/migrate-db.mjs).
export const LOGIN_ATTEMPTS_COLLECTION_ID = "loginAttempts"
export const PAYMENT_EVENTS_COLLECTION_ID = "paymentEvents"

// Documents in `loginAttempts`. $id is a hash of (scope, key) so no raw
// email or IP is stored.
export interface LoginAttemptDoc {
  $id: string
  scope: "ip_email" | "email"
  failures: number
  windowStart: string
  lockedUntil?: string | null
}

// Documents in `paymentEvents` — one per Paystack reference that has granted
// access. $id is derived from the reference and `reference` has a unique index,
// so a reference can only ever be applied once.
export interface PaymentEventDoc {
  $id: string
  reference: string
  userId: string
  amount: number
  currency: string
  source: "webhook" | "verify"
  processedAt: string
  periodEnd?: string
}

// Customer upgrades (tables in db/migrations/0001_init.sql).
export const REMINDER_LOG_COLLECTION_ID = "reminderLog"

// One document per (user, reminder type, Lagos day) — the dedupe record.
export interface ReminderLogDoc {
  $id: string
  userId: string
  type: string
  day: string
  status: "sending" | "sent"
  createdAt: string
}

export const REFERRALS_COLLECTION_ID = "referrals"

// One document per referred user ($id derived from referredId, unique index
// on referredId), so a referral can only ever be rewarded once.
export interface ReferralDoc {
  $id: string
  referrerId: string
  referredId: string
  status: "processing" | "rewarded" | "rejected"
  reason?: string | null
  reference?: string | null
  rewardDays?: number
  referrerRewarded?: boolean
  referredRewarded?: boolean
  createdAt: string
}

export const FIRST_WEEK_PLANS_COLLECTION_ID = "firstWeekPlans"

// One document per user ($id = user $id) holding the generated plan.
export interface FirstWeekPlanDoc {
  $id: string
  userId: string
  planJson: string
  rulesVersion?: number
  generatedAt: string
}
