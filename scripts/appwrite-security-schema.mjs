// Idempotent provisioning for the security-related collections (login
// throttling + Paystack payment idempotency). Shared by seed-appwrite.mjs and
// migrate-appwrite.mjs. Both collections have no client permissions: only the
// server API key can read/write them.
import { DatabasesIndexType, OrderBy } from "node-appwrite"

export const LOGIN_ATTEMPTS_COLLECTION_ID = "loginAttempts"
export const PAYMENT_EVENTS_COLLECTION_ID = "paymentEvents"

const isConflict = (err) => err?.code === 409

async function attempt(fn, label, log) {
  try {
    await fn()
    log(`  + ${label}`)
  } catch (err) {
    if (!isConflict(err)) throw err
  }
}

async function waitForAttributes(databases, databaseId, collectionId, keys) {
  const deadline = Date.now() + 60_000
  for (const key of keys) {
    while (true) {
      const attr = await databases.getAttribute({ databaseId, collectionId, key })
      if (attr.status === "available") break
      if (attr.status === "failed") throw new Error(`Attribute ${collectionId}.${key} failed to provision`)
      if (Date.now() > deadline) throw new Error(`Timed out waiting for ${collectionId}.${key}`)
      await new Promise((r) => setTimeout(r, 750))
    }
  }
}

export async function ensureSecuritySchema(databases, databaseId, log = console.log) {
  const str = (collectionId, key, size, required) =>
    attempt(() => databases.createStringAttribute({ databaseId, collectionId, key, size, required }), `string ${collectionId}.${key}`, log)
  const int = (collectionId, key, required) =>
    attempt(() => databases.createIntegerAttribute({ databaseId, collectionId, key, required }), `integer ${collectionId}.${key}`, log)
  const dt = (collectionId, key, required) =>
    attempt(() => databases.createDatetimeAttribute({ databaseId, collectionId, key, required }), `datetime ${collectionId}.${key}`, log)
  const coll = (collectionId, name) =>
    attempt(() => databases.createCollection({ databaseId, collectionId, name, permissions: [], documentSecurity: false }), `collection ${collectionId}`, log)

  // --- loginAttempts: one doc per hashed (scope, key) ---
  const L = LOGIN_ATTEMPTS_COLLECTION_ID
  await coll(L, "Login Attempts")
  await str(L, "scope", 20, true)
  await int(L, "failures", true)
  await dt(L, "windowStart", true)
  await dt(L, "lockedUntil", false)
  await waitForAttributes(databases, databaseId, L, ["scope", "failures", "windowStart", "lockedUntil"])

  // --- paymentEvents: one doc per processed Paystack reference ---
  const P = PAYMENT_EVENTS_COLLECTION_ID
  await coll(P, "Payment Events")
  await str(P, "reference", 255, true)
  await str(P, "userId", 255, true)
  await int(P, "amount", true)
  await str(P, "currency", 10, true)
  await str(P, "source", 20, true)
  await dt(P, "processedAt", true)
  await dt(P, "periodEnd", false)
  await waitForAttributes(databases, databaseId, P, ["reference", "userId", "amount", "currency", "source", "processedAt", "periodEnd"])
  await attempt(
    () => databases.createIndex({ databaseId, collectionId: P, key: "reference_unique", type: DatabasesIndexType.Unique, attributes: ["reference"], orders: [OrderBy.Asc] }),
    `unique index ${P}.reference_unique`,
    log
  )
}
