import { createHash, randomInt } from "crypto"
import { Query } from "@/lib/db/query"
import { db as serverDb } from "@/lib/db/client"
import {
  PAYMENT_EVENTS_COLLECTION_ID,
  REFERRALS_COLLECTION_ID,
  USERS_COLLECTION_ID,
  type UserDoc,
  type ReferralDoc,
} from "@/lib/db/schema"
import { normalizePhone } from "@/lib/phone"

export const REFERRAL_REWARD_DAYS = 30
export const REFERRAL_COOKIE = "drefit_ref"
const DAY_MS = 86_400_000
// No 0/O/1/I/L to keep codes easy to read out loud.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"

export function generateReferralCode(length = 7, rand: (max: number) => number = randomInt): string {
  let out = ""
  for (let i = 0; i < length; i++) out += ALPHABET[rand(ALPHABET.length)]
  return out
}

export function normalizeReferralCode(input: unknown): string | null {
  if (typeof input !== "string") return null
  const code = input.trim().toUpperCase()
  return /^[A-Z0-9]{4,16}$/.test(code) ? code : null
}

export function referralLink(origin: string, code: string): string {
  return `${origin.replace(/\/$/, "")}/register?ref=${encodeURIComponent(code)}`
}

type Db = typeof serverDb

export async function findUserByReferralCode(code: string, db: Db = serverDb): Promise<UserDoc | null> {
  const res = await db.listDocuments(USERS_COLLECTION_ID, [Query.equal("referralCode", code), Query.limit(1)])
  return (res.documents[0] as unknown as UserDoc) ?? null
}

// Resolve a code at signup to the referrer's id; null for unknown codes or
// self-referral by email.
export async function resolveReferrerId(code: unknown, newUserEmail: string, db: Db = serverDb): Promise<string | null> {
  const normalized = normalizeReferralCode(code)
  if (!normalized) return null
  const referrer = await findUserByReferralCode(normalized, db).catch(() => null)
  if (!referrer) return null
  if (referrer.email.trim().toLowerCase() === newUserEmail.trim().toLowerCase()) return null
  return referrer.$id
}

// Lazily give a user a unique code (unique index on users.referralCode).
export async function ensureReferralCode(user: UserDoc, db: Db = serverDb): Promise<string> {
  if (user.referralCode) return user.referralCode
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateReferralCode()
    try {
      await db.updateDocument(USERS_COLLECTION_ID, user.$id, { referralCode: code })
      return code
    } catch (err) {
      if ((err as { code?: number })?.code !== 409) throw err
    }
  }
  throw new Error("Could not allocate a unique referral code")
}

export function referralDocId(referredId: string): string {
  return createHash("sha256").update(`referral:${referredId}`).digest("hex").slice(0, 36)
}

// +days for one user: extends a running paid period or trial from its end,
// otherwise starts a paid period from now.
export function extendedAccess(user: UserDoc, days: number, now: Date): Partial<UserDoc> {
  const add = days * DAY_MS
  const nowMs = now.getTime()
  const periodEnd = user.subscriptionCurrentPeriodEnd ? new Date(user.subscriptionCurrentPeriodEnd).getTime() : NaN
  const trialEnd = user.trialEndsAt ? new Date(user.trialEndsAt).getTime() : NaN
  if (user.subscriptionStatus === "active") {
    const base = !Number.isNaN(periodEnd) && periodEnd > nowMs ? periodEnd : nowMs
    return { subscriptionCurrentPeriodEnd: new Date(base + add).toISOString() }
  }
  if (user.subscriptionStatus === "trialing" && !Number.isNaN(trialEnd) && trialEnd > nowMs) {
    return { trialEndsAt: new Date(trialEnd + add).toISOString() }
  }
  return { subscriptionStatus: "active", subscriptionCurrentPeriodEnd: new Date(nowMs + add).toISOString() }
}

export function selfReferralReason(referrer: UserDoc, referred: UserDoc): string | null {
  if (referrer.$id === referred.$id) return "self_referral"
  if (referrer.email.trim().toLowerCase() === referred.email.trim().toLowerCase()) return "same_email"
  const a = normalizePhone(referrer.phone ?? "")
  const b = normalizePhone(referred.phone ?? "")
  if (a && b && a === b) return "same_phone"
  return null
}

export type ReferralRewardResult = "rewarded" | "already_processed" | "not_referred" | "not_first_charge" | "rejected"

// Called after a verified successful charge has been applied to `referred`.
// Rewards both parties once per referred user, only on their first paid
// charge. Per-party flags make a retry after a partial failure safe.
export async function rewardReferralOnFirstCharge(
  referredId: string,
  reference: string,
  opts: { db?: Db; now?: Date } = {}
): Promise<ReferralRewardResult> {
  const db = opts.db ?? serverDb
  const now = opts.now ?? new Date()
  const referred = (await db.getDocument(USERS_COLLECTION_ID, referredId)) as unknown as UserDoc
  if (!referred.referredBy) return "not_referred"

  const docId = referralDocId(referredId)
  let doc: ReferralDoc
  try {
    const payments = await db.listDocuments(PAYMENT_EVENTS_COLLECTION_ID, [Query.equal("userId", referredId), Query.limit(2)])
    // Only the first ever paid charge qualifies (and the referral record
    // below makes later calls no-ops either way).
    const first = payments.total <= 1
    doc = (await db.createDocument(REFERRALS_COLLECTION_ID, docId, {
      referrerId: referred.referredBy,
      referredId,
      status: first ? "processing" : "rejected",
      reason: first ? null : "not_first_charge",
      reference,
      rewardDays: REFERRAL_REWARD_DAYS,
      referrerRewarded: false,
      referredRewarded: false,
      createdAt: now.toISOString(),
    })) as unknown as ReferralDoc
    if (!first) return "not_first_charge"
  } catch (err) {
    if ((err as { code?: number })?.code !== 409) throw err
    doc = (await db.getDocument(REFERRALS_COLLECTION_ID, docId)) as unknown as ReferralDoc
    if (doc.status !== "processing") return "already_processed"
  }

  const referrer = (await db
    .getDocument(USERS_COLLECTION_ID, doc.referrerId)
    .catch(() => null)) as unknown as UserDoc | null
  const reason = referrer ? selfReferralReason(referrer, referred) : "referrer_missing"
  if (!referrer || reason) {
    await db.updateDocument(REFERRALS_COLLECTION_ID, docId, { status: "rejected", reason })
    return "rejected"
  }

  if (!doc.referredRewarded) {
    await db.updateDocument(USERS_COLLECTION_ID, referred.$id, extendedAccess(referred, REFERRAL_REWARD_DAYS, now))
    await db.updateDocument(REFERRALS_COLLECTION_ID, docId, { referredRewarded: true })
  }
  if (!doc.referrerRewarded) {
    await db.updateDocument(USERS_COLLECTION_ID, referrer.$id, extendedAccess(referrer, REFERRAL_REWARD_DAYS, now))
    await db.updateDocument(REFERRALS_COLLECTION_ID, docId, { referrerRewarded: true })
  }
  await db.updateDocument(REFERRALS_COLLECTION_ID, docId, { status: "rewarded" })
  return "rewarded"
}
