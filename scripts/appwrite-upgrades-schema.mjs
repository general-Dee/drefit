// Idempotent provisioning for the customer-upgrade features (WhatsApp
// reminders, referrals, onboarding plan). Applied by migrate-appwrite.mjs
// before every build and by seed-appwrite.mjs. Safe to re-run.
import { DatabasesIndexType, OrderBy } from "node-appwrite"

export const REMINDER_LOG_COLLECTION_ID = "reminderLog"
export const REFERRALS_COLLECTION_ID = "referrals"

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
}
