import { describe, it, expect, vi, beforeEach } from "vitest"

const db = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID = "testdb"
  const tables = new Map<string, Map<string, Record<string, unknown>>>()
  const t = (c: string) => {
    if (!tables.has(c)) tables.set(c, new Map())
    return tables.get(c)!
  }
  return {
    tables,
    t,
    failNextUserUpdateFor: null as string | null,
    getDocument: vi.fn(async (_d: string, c: string, id: string) => {
      const doc = t(c).get(id)
      if (!doc) throw { code: 404 }
      return { $id: id, ...doc }
    }),
    createDocument: vi.fn(async (_d: string, c: string, id: string, data: Record<string, unknown>) => {
      if (t(c).has(id)) throw { code: 409 }
      t(c).set(id, { ...data })
      return { $id: id, ...data }
    }),
    updateDocument: vi.fn(async (_d: string, c: string, id: string, data: Record<string, unknown>) => {
      if (c === "users" && db.failNextUserUpdateFor === id) {
        db.failNextUserUpdateFor = null
        throw new Error("appwrite down")
      }
      t(c).set(id, { ...t(c).get(id), ...data })
      return { $id: id, ...t(c).get(id) }
    }),
    listDocuments: vi.fn(async (_d: string, c: string, queries: string[]) => {
      const filters = queries.map((q) => JSON.parse(q)).filter((q) => q.method === "equal")
      const docs = [...t(c).entries()]
        .map(([id, d]) => ({ $id: id, ...d }))
        .filter((d) => filters.every((f) => (f.values as unknown[]).includes((d as Record<string, unknown>)[f.attribute])))
      return { total: docs.length, documents: docs }
    }),
  }
})
vi.mock("@/lib/appwrite/server", () => ({ serverDatabases: db }))

import {
  extendedAccess,
  generateReferralCode,
  normalizeReferralCode,
  referralLink,
  resolveReferrerId,
  rewardReferralOnFirstCharge,
  selfReferralReason,
} from "./referrals"
import type { AppwriteUserDoc } from "@/lib/appwrite/schema"

const NOW = new Date("2026-10-17T10:00:00Z")
const DAY = 86_400_000
const iso = (ms: number) => new Date(ms).toISOString()

function seed() {
  db.tables.clear()
  db.t("users").set("referrer", {
    name: "Ref", email: "ref@example.com", referralCode: "ABC2345",
    subscriptionStatus: "active", subscriptionCurrentPeriodEnd: iso(NOW.getTime() + 10 * DAY),
  })
  db.t("users").set("friend", {
    name: "Friend", email: "friend@example.com", referredBy: "referrer",
    subscriptionStatus: "active", subscriptionCurrentPeriodEnd: iso(NOW.getTime() + 30 * DAY),
  })
  db.t("paymentEvents").set("p1", { userId: "friend", reference: "ref_1" })
}

const end = (id: string) => new Date(db.t("users").get(id)!.subscriptionCurrentPeriodEnd as string).getTime()

describe("codes and links", () => {
  it("generates readable codes without ambiguous characters", () => {
    const code = generateReferralCode()
    expect(code).toMatch(/^[A-HJ-KM-NP-Z2-9]{7}$/)
    expect(generateReferralCode(7, () => 0)).toBe("AAAAAAA")
  })
  it("normalises codes", () => {
    expect(normalizeReferralCode(" abc2345 ")).toBe("ABC2345")
    expect(normalizeReferralCode("ab")).toBeNull()
    expect(normalizeReferralCode("abc-123")).toBeNull()
    expect(normalizeReferralCode(undefined)).toBeNull()
  })
  it("builds the share link", () => {
    expect(referralLink("https://drefit.vercel.app/", "ABC2345")).toBe("https://drefit.vercel.app/register?ref=ABC2345")
  })
})

describe("resolveReferrerId at signup", () => {
  beforeEach(seed)
  it("resolves a valid code", async () => {
    expect(await resolveReferrerId("abc2345", "new@example.com")).toBe("referrer")
  })
  it("ignores unknown codes and self-referral by email", async () => {
    expect(await resolveReferrerId("ZZZZZZZ", "new@example.com")).toBeNull()
    expect(await resolveReferrerId("ABC2345", "Ref@Example.com")).toBeNull()
  })
})

describe("self-referral checks", () => {
  const u = (o: Partial<AppwriteUserDoc>) => ({ $id: "a", name: "", email: "a@x.com", password: "", ...o }) as AppwriteUserDoc
  it("flags same id, email or phone", () => {
    expect(selfReferralReason(u({}), u({}))).toBe("self_referral")
    expect(selfReferralReason(u({}), u({ $id: "b", email: "A@X.com" }))).toBe("same_email")
    expect(selfReferralReason(u({ phone: "+2348031234567" }), u({ $id: "b", email: "b@x.com", phone: "08031234567" }))).toBe("same_phone")
    expect(selfReferralReason(u({ phone: "+2348031234567" }), u({ $id: "b", email: "b@x.com", phone: "08039999999" }))).toBeNull()
  })
})

describe("extendedAccess", () => {
  const base = { $id: "x", name: "", email: "", password: "" } as AppwriteUserDoc
  it("extends an active period from its end", () => {
    const r = extendedAccess({ ...base, subscriptionStatus: "active", subscriptionCurrentPeriodEnd: iso(NOW.getTime() + 5 * DAY) }, 30, NOW)
    expect(r.subscriptionCurrentPeriodEnd).toBe(iso(NOW.getTime() + 35 * DAY))
  })
  it("extends a running trial", () => {
    const r = extendedAccess({ ...base, subscriptionStatus: "trialing", trialEndsAt: iso(NOW.getTime() + 2 * DAY) }, 30, NOW)
    expect(r.trialEndsAt).toBe(iso(NOW.getTime() + 32 * DAY))
  })
  it("starts a period from now when lapsed", () => {
    expect(extendedAccess({ ...base, subscriptionStatus: "inactive" }, 30, NOW)).toEqual({
      subscriptionStatus: "active",
      subscriptionCurrentPeriodEnd: iso(NOW.getTime() + 30 * DAY),
    })
  })
})

describe("rewardReferralOnFirstCharge", () => {
  beforeEach(seed)

  it("gives both users +30 days exactly once", async () => {
    const r0 = end("referrer"), f0 = end("friend")
    expect(await rewardReferralOnFirstCharge("friend", "ref_1", { now: NOW })).toBe("rewarded")
    expect(end("referrer") - r0).toBe(30 * DAY)
    expect(end("friend") - f0).toBe(30 * DAY)
    expect(await rewardReferralOnFirstCharge("friend", "ref_1", { now: NOW })).toBe("already_processed")
    expect(await rewardReferralOnFirstCharge("friend", "ref_2", { now: NOW })).toBe("already_processed")
    expect(end("referrer") - r0).toBe(30 * DAY)
    expect(end("friend") - f0).toBe(30 * DAY)
  })

  it("does nothing for users who were not referred", async () => {
    expect(await rewardReferralOnFirstCharge("referrer", "ref_x", { now: NOW })).toBe("not_referred")
    expect(db.t("referrals").size).toBe(0)
  })

  it("only the first paid charge qualifies", async () => {
    db.t("paymentEvents").set("p2", { userId: "friend", reference: "ref_2" })
    const f0 = end("friend")
    expect(await rewardReferralOnFirstCharge("friend", "ref_2", { now: NOW })).toBe("not_first_charge")
    expect(end("friend")).toBe(f0)
    expect(await rewardReferralOnFirstCharge("friend", "ref_2", { now: NOW })).toBe("already_processed")
  })

  it("rejects same-email and same-phone referrals without rewards", async () => {
    db.t("users").get("friend")!.phone = "08031234567"
    db.t("users").get("referrer")!.phone = "+2348031234567"
    const r0 = end("referrer")
    expect(await rewardReferralOnFirstCharge("friend", "ref_1", { now: NOW })).toBe("rejected")
    expect(end("referrer")).toBe(r0)
    expect([...db.t("referrals").values()][0]).toMatchObject({ status: "rejected", reason: "same_phone" })
  })

  it("rejects self-referral", async () => {
    db.t("users").get("friend")!.referredBy = "friend"
    expect(await rewardReferralOnFirstCharge("friend", "ref_1", { now: NOW })).toBe("rejected")
  })

  it("a retry after a partial failure never double-grants", async () => {
    const r0 = end("referrer"), f0 = end("friend")
    db.failNextUserUpdateFor = "referrer"
    await expect(rewardReferralOnFirstCharge("friend", "ref_1", { now: NOW })).rejects.toThrow()
    expect(end("friend") - f0).toBe(30 * DAY)
    expect(end("referrer")).toBe(r0)
    expect(await rewardReferralOnFirstCharge("friend", "ref_1", { now: NOW })).toBe("rewarded")
    expect(end("friend") - f0).toBe(30 * DAY)
    expect(end("referrer") - r0).toBe(30 * DAY)
  })
})
