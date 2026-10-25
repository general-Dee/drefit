// Idempotent provisioning for the customer-upgrade features (WhatsApp
// reminders, referrals, onboarding plan). Applied by migrate-appwrite.mjs
// before every build and by seed-appwrite.mjs. Safe to re-run.
import { DatabasesIndexType, OrderBy } from "node-appwrite"

export const REMINDER_LOG_COLLECTION_ID = "reminderLog"
export const REFERRALS_COLLECTION_ID = "referrals"
export const FIRST_WEEK_PLANS_COLLECTION_ID = "firstWeekPlans"

const isConflict = (err) => err?.code === 409

function helpers(databases, databaseId, log) {
  const attempt = async (fn, label) => {
    try {
      await fn()
      log(`  + ${label}`)
    } catch (err) {
      if (!isConflict(err)) throw err
    }
  }
  return {
    coll: (collectionId, name) =>
      attempt(() => databases.createCollection({ databaseId, collectionId, name, permissions: [], documentSecurity: false }), `collection ${collectionId}`),
    str: (collectionId, key, size, required = false, xdefault) =>
      attempt(() => databases.createStringAttribute({ databaseId, collectionId, key, size, required, xdefault: required ? undefined : xdefault }), `string ${collectionId}.${key}`),
    int: (collectionId, key, required = false, min, max) =>
      attempt(() => databases.createIntegerAttribute({ databaseId, collectionId, key, required, min, max }), `integer ${collectionId}.${key}`),
    bool: (collectionId, key, required = false, xdefault) =>
      attempt(() => databases.createBooleanAttribute({ databaseId, collectionId, key, required, xdefault: required ? undefined : xdefault }), `boolean ${collectionId}.${key}`),
    dt: (collectionId, key, required = false) =>
      attempt(() => databases.createDatetimeAttribute({ databaseId, collectionId, key, required }), `datetime ${collectionId}.${key}`),
    index: (collectionId, key, type, attributes) =>
      attempt(
        () => databases.createIndex({ databaseId, collectionId, key, type, attributes, orders: attributes.map(() => OrderBy.Asc) }),
        `index ${collectionId}.${key}`
      ),
    wait: async (collectionId, keys) => {
      const deadline = Date.now() + 90_000
      for (const key of keys) {
        while (true) {
          const attr = await databases.getAttribute({ databaseId, collectionId, key })
          if (attr.status === "available") break
          if (attr.status === "failed") throw new Error(`Attribute ${collectionId}.${key} failed to provision`)
          if (Date.now() > deadline) throw new Error(`Timed out waiting for ${collectionId}.${key}`)
          await new Promise((r) => setTimeout(r, 750))
        }
      }
    },
  }
}

export async function ensureUpgradesSchema(databases, databaseId, log = console.log) {
  const h = helpers(databases, databaseId, log)

  // --- Upgrade 1: WhatsApp reminders ---
  await h.str("users", "phone", 20)
  await h.bool("users", "whatsappOptIn", false, false)
  await h.int("users", "reminderHour", false, 0, 23)
  await h.wait("users", ["phone", "whatsappOptIn", "reminderHour"])
  await h.index("users", "whatsappOptIn_idx", DatabasesIndexType.Key, ["whatsappOptIn"])

  const R = REMINDER_LOG_COLLECTION_ID
  await h.coll(R, "Reminder Log")
  await h.str(R, "userId", 255, true)
  await h.str(R, "type", 50, true)
  await h.str(R, "day", 10, true)
  await h.str(R, "status", 20, true)
  await h.dt(R, "createdAt", true)
  await h.wait(R, ["userId", "type", "day", "status", "createdAt"])
  await h.index(R, "user_type_day_unique", DatabasesIndexType.Unique, ["userId", "type", "day"])

  // --- Upgrade 3: referrals ---
  await h.str("users", "referralCode", 16)
  await h.str("users", "referredBy", 255)
  await h.wait("users", ["referralCode", "referredBy"])
  await h.index("users", "referralCode_unique", DatabasesIndexType.Unique, ["referralCode"])
  await h.index("users", "referredBy_idx", DatabasesIndexType.Key, ["referredBy"])

  const F = REFERRALS_COLLECTION_ID
  await h.coll(F, "Referrals")
  await h.str(F, "referrerId", 255, true)
  await h.str(F, "referredId", 255, true)
  await h.str(F, "status", 20, true)
  await h.str(F, "reason", 100)
  await h.str(F, "reference", 255)
  await h.int(F, "rewardDays", false, 0, 365)
  await h.bool(F, "referrerRewarded", false, false)
  await h.bool(F, "referredRewarded", false, false)
  await h.dt(F, "createdAt", true)
  await h.wait(F, ["referrerId", "referredId", "status", "reason", "reference", "rewardDays", "referrerRewarded", "referredRewarded", "createdAt"])
  await h.index(F, "referredId_unique", DatabasesIndexType.Unique, ["referredId"])
  await h.index(F, "referrer_status_idx", DatabasesIndexType.Key, ["referrerId", "status"])

  // --- Upgrade 5: richer onboarding + first-week plan ---
  await h.int("users", "daysPerWeek", false, 1, 7)
  await h.str("users", "equipment", 10)
  await h.str("users", "limitationsJson", 300)
  await h.str("users", "limitationsNote", 300)
  await h.wait("users", ["daysPerWeek", "equipment", "limitationsJson", "limitationsNote"])

  // Plan JSON lives in its own collection (document id = user id) so the
  // large text field doesn't count against the users row size.
  const W = FIRST_WEEK_PLANS_COLLECTION_ID
  await h.coll(W, "First Week Plans")
  await h.str(W, "userId", 255, true)
  await h.str(W, "planJson", 20000, true)
  await h.int(W, "rulesVersion", false, 0, 1000)
  await h.dt(W, "generatedAt", true)
  await h.wait(W, ["userId", "planJson", "rulesVersion", "generatedAt"])
}
