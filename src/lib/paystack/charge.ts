import { createHash, createHmac, timingSafeEqual } from "crypto"
import { Query } from "node-appwrite"
import { serverDatabases } from "@/lib/appwrite/server"
import {
  DATABASE_ID,
  PAYMENT_EVENTS_COLLECTION_ID,
  USERS_COLLECTION_ID,
  type AppwriteUserDoc,
} from "@/lib/appwrite/schema"
import { PLAN_AMOUNT_KOBO, PLAN_CURRENCY, PLAN_PERIOD_DAYS } from "@/lib/paystack/plan"
import { rewardReferralOnFirstCharge } from "@/lib/referrals"

const DAY_MS = 24 * 60 * 60 * 1000

// Subset of Paystack's transaction object that we rely on.
export interface PaystackTransaction {
  reference: string
  status: string
  amount: number
  currency: string
  paid_at?: string | null
  customer?: { email?: string | null } | null
  metadata?: unknown
}

// Constant-time HMAC-SHA512 check of the raw request body.
export function verifyPaystackSignature(rawBody: string, signature: string | null, secret: string | undefined): boolean {
  if (!signature || !secret) return false
  const expected = Buffer.from(createHmac("sha512", secret).update(rawBody).digest("hex"), "utf8")
  const given = Buffer.from(signature.trim().toLowerCase(), "utf8")
  if (given.length !== expected.length) return false
  return timingSafeEqual(given, expected)
}

export type ChargeCheck = { ok: true } | { ok: false; reason: string }

// Only a successful charge for exactly the plan price in NGN grants access.
export function validateCharge(tx: PaystackTransaction | null | undefined): ChargeCheck {
  if (!tx || typeof tx.reference !== "string" || !tx.reference) return { ok: false, reason: "missing reference" }
  if (tx.status !== "success") return { ok: false, reason: `status ${tx.status}` }
  if (tx.currency !== PLAN_CURRENCY) return { ok: false, reason: `currency ${tx.currency}` }
  if (Number(tx.amount) !== PLAN_AMOUNT_KOBO) return { ok: false, reason: `amount ${tx.amount}` }
  return { ok: true }
}

export function metadataUserId(metadata: unknown): string | null {
  let m = metadata
  if (typeof m === "string") {
    try {
      m = JSON.parse(m)
    } catch {
      return null
    }
  }
  if (m && typeof m === "object" && typeof (m as { userId?: unknown }).userId === "string") {
    return (m as { userId: string }).userId
  }
  return null
}

// New period end: 30 days from payment, or from the end of a still-running
// paid period if the member renews early (so early renewals don't lose days).
export function computePeriodEnd(paidAt: Date, currentStatus?: string, currentPeriodEnd?: string): Date {
  let base = paidAt.getTime()
  if (currentStatus === "active" && currentPeriodEnd) {
    const end = new Date(currentPeriodEnd).getTime()
    if (!Number.isNaN(end) && end > base) base = end
  }
  return new Date(base + PLAN_PERIOD_DAYS * DAY_MS)
}

export function paymentEventId(reference: string): string {
  return createHash("sha256").update(`paystack:${reference}`).digest("hex").slice(0, 36)
}

export function isValidReference(reference: unknown): reference is string {
  return typeof reference === "string" && /^[A-Za-z0-9._=-]{1,100}$/.test(reference)
}

// Server-to-server confirmation of a transaction with Paystack.
export async function fetchVerifiedTransaction(reference: string): Promise<PaystackTransaction> {
  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    cache: "no-store",
  })
  const body = await res.json().catch(() => null)
  if (!res.ok || !body?.status || !body.data) {
    throw new Error(`Paystack verify failed (${res.status}): ${body?.message ?? "no body"}`)
  }
  return body.data as PaystackTransaction
}

export async function findUser(tx: PaystackTransaction): Promise<AppwriteUserDoc | null> {
  const id = metadataUserId(tx.metadata)
  if (id) {
    const doc = await serverDatabases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, id).catch((err) => {
      if ((err as { code?: number })?.code === 404) return null
      throw err
    })
    if (doc) return doc as unknown as AppwriteUserDoc
  }
  const email = tx.customer?.email
  if (!email) return null
  const res = await serverDatabases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [Query.equal("email", email), Query.limit(1)])
  return (res.documents[0] as unknown as AppwriteUserDoc) ?? null
}

export type ApplyResult =
  | { status: "activated"; userId: string; periodEnd: string }
  | { status: "duplicate" }
  | { status: "rejected"; reason: string }
  | { status: "user_not_found" }

// Grants one billing period for a verified transaction, exactly once per
// reference. The paymentEvents document (deterministic id + unique index on
// reference) is the idempotency claim; if updating the user fails afterwards
// the claim is released so a retry can succeed.
export async function applyVerifiedCharge(
  tx: PaystackTransaction,
  source: "webhook" | "verify",
  opts: { expectedUserId?: string } = {}
): Promise<ApplyResult> {
  const check = validateCharge(tx)
  if (!check.ok) return { status: "rejected", reason: check.reason }

  const user = await findUser(tx)
  if (!user) return { status: "user_not_found" }
  if (opts.expectedUserId && user.$id !== opts.expectedUserId) {
    return { status: "rejected", reason: "transaction belongs to a different user" }
  }

  const paidAt = tx.paid_at ? new Date(tx.paid_at) : new Date()
  const periodEnd = computePeriodEnd(Number.isNaN(paidAt.getTime()) ? new Date() : paidAt, user.subscriptionStatus, user.subscriptionCurrentPeriodEnd).toISOString()
  const eventId = paymentEventId(tx.reference)

  try {
    await serverDatabases.createDocument(DATABASE_ID, PAYMENT_EVENTS_COLLECTION_ID, eventId, {
      reference: tx.reference,
      userId: user.$id,
      amount: Number(tx.amount),
      currency: tx.currency,
      source,
      processedAt: new Date().toISOString(),
      periodEnd,
    })
  } catch (err) {
    if ((err as { code?: number })?.code === 409) {
      // Retry-safe: completes a referral reward that may have failed earlier.
      await safeReferralReward(user.$id, tx.reference)
      return { status: "duplicate" }
    }
    throw err
  }

  try {
    await serverDatabases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, user.$id, {
      subscriptionStatus: "active",
      subscriptionId: tx.reference,
      subscriptionCurrentPeriodEnd: periodEnd,
    })
  } catch (err) {
    await serverDatabases.deleteDocument(DATABASE_ID, PAYMENT_EVENTS_COLLECTION_ID, eventId).catch((e) =>
      console.error("failed to release payment claim", tx.reference, e)
    )
    throw err
  }

  await safeReferralReward(user.$id, tx.reference)
  return { status: "activated", userId: user.$id, periodEnd }
}

// Referral rewards must never break payment handling.
async function safeReferralReward(userId: string, reference: string): Promise<void> {
  try {
    const result = await rewardReferralOnFirstCharge(userId, reference)
    if (result !== "not_referred") console.log(`referral reward for ${userId}: ${result}`)
  } catch (err) {
    console.error("referral reward failed", userId, err)
  }
}
