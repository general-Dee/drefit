import { describe, it, expect, vi, beforeEach } from "vitest"
import { createHmac } from "crypto"

const db = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID = "testdb"
  return {
    getDocument: vi.fn(),
    listDocuments: vi.fn(),
    createDocument: vi.fn(),
    updateDocument: vi.fn(),
    deleteDocument: vi.fn(),
  }
})
vi.mock("@/lib/appwrite/server", () => ({ serverDatabases: db }))

import {
  applyVerifiedCharge,
  computePeriodEnd,
  isValidReference,
  metadataUserId,
  paymentEventId,
  validateCharge,
  verifyPaystackSignature,
  type PaystackTransaction,
} from "./charge"

const DAY = 24 * 60 * 60 * 1000
const tx = (over: Partial<PaystackTransaction> = {}): PaystackTransaction => ({
  reference: "ref_123",
  status: "success",
  amount: 500000,
  currency: "NGN",
  paid_at: "2026-10-17T12:00:00.000Z",
  customer: { email: "member@example.com" },
  metadata: { userId: "user1" },
  ...over,
})

describe("verifyPaystackSignature", () => {
  const secret = "sk_test_dummy"
  const body = JSON.stringify({ event: "charge.success", data: { reference: "r" } })
  const sig = createHmac("sha512", secret).update(body).digest("hex")

  it("accepts a correct HMAC-SHA512 of the raw body", () => {
    expect(verifyPaystackSignature(body, sig, secret)).toBe(true)
  })
  it("rejects a tampered body", () => {
    expect(verifyPaystackSignature(body + " ", sig, secret)).toBe(false)
  })
  it("rejects wrong, truncated or missing signatures and a missing secret", () => {
    expect(verifyPaystackSignature(body, sig.replace(/^./, sig[0] === "a" ? "b" : "a"), secret)).toBe(false)
    expect(verifyPaystackSignature(body, sig.slice(0, 20), secret)).toBe(false)
    expect(verifyPaystackSignature(body, null, secret)).toBe(false)
    expect(verifyPaystackSignature(body, sig, undefined)).toBe(false)
  })
})

describe("validateCharge", () => {
  it("accepts a successful ₦5,000 NGN charge", () => {
    expect(validateCharge(tx())).toEqual({ ok: true })
  })
  it.each(["failed", "abandoned", "reversed", "pending"])("rejects status %s", (status) => {
    expect(validateCharge(tx({ status })).ok).toBe(false)
  })
  it("rejects wrong amount or currency", () => {
    expect(validateCharge(tx({ amount: 100 })).ok).toBe(false)
    expect(validateCharge(tx({ amount: 5000 })).ok).toBe(false)
    expect(validateCharge(tx({ currency: "USD" })).ok).toBe(false)
  })
  it("rejects a missing reference", () => {
    expect(validateCharge(tx({ reference: "" })).ok).toBe(false)
    expect(validateCharge(null).ok).toBe(false)
  })
})

describe("helpers", () => {
  it("reads userId from object or JSON-string metadata", () => {
    expect(metadataUserId({ userId: "a" })).toBe("a")
    expect(metadataUserId('{"userId":"b"}')).toBe("b")
    expect(metadataUserId("nope")).toBeNull()
    expect(metadataUserId(null)).toBeNull()
  })
  it("extends from payment date, or from a still-active period end", () => {
    const paid = new Date("2026-10-01T00:00:00Z")
    expect(computePeriodEnd(paid).toISOString()).toBe(new Date(paid.getTime() + 30 * DAY).toISOString())
    const end = "2026-10-10T00:00:00.000Z"
    expect(computePeriodEnd(paid, "active", end).toISOString()).toBe(new Date(new Date(end).getTime() + 30 * DAY).toISOString())
    expect(computePeriodEnd(paid, "inactive", end).toISOString()).toBe(new Date(paid.getTime() + 30 * DAY).toISOString())
  })
  it("derives a stable Appwrite-safe id per reference", () => {
    expect(paymentEventId("x")).toBe(paymentEventId("x"))
    expect(paymentEventId("x")).not.toBe(paymentEventId("y"))
    expect(paymentEventId("x")).toMatch(/^[a-f0-9]{36}$/)
  })
  it("validates reference format", () => {
    expect(isValidReference("T123_abc-9")).toBe(true)
    expect(isValidReference("../etc")).toBe(false)
    expect(isValidReference("")).toBe(false)
    expect(isValidReference(5)).toBe(false)
  })
})

describe("applyVerifiedCharge", () => {
  beforeEach(() => {
    Object.values(db).forEach((f) => f.mockReset())
    db.getDocument.mockResolvedValue({ $id: "user1", email: "member@example.com", subscriptionStatus: "trialing" })
    db.createDocument.mockResolvedValue({})
    db.updateDocument.mockResolvedValue({})
    db.deleteDocument.mockResolvedValue({})
  })

  it("activates the user matched by metadata and records the reference", async () => {
    const r = await applyVerifiedCharge(tx(), "webhook")
    expect(r.status).toBe("activated")
    expect(db.createDocument).toHaveBeenCalledWith("testdb", "paymentEvents", paymentEventId("ref_123"), expect.objectContaining({ reference: "ref_123", userId: "user1", amount: 500000 }))
    expect(db.updateDocument).toHaveBeenCalledWith("testdb", "users", "user1", expect.objectContaining({ subscriptionStatus: "active", subscriptionId: "ref_123" }))
  })

  it("falls back to customer email when metadata has no user", async () => {
    db.listDocuments.mockResolvedValue({ documents: [{ $id: "user2", email: "member@example.com" }] })
    const r = await applyVerifiedCharge(tx({ metadata: null }), "webhook")
    expect(r).toMatchObject({ status: "activated", userId: "user2" })
  })

  it("is idempotent: a reference already recorded does not grant again", async () => {
    db.createDocument.mockRejectedValue({ code: 409 })
    const r = await applyVerifiedCharge(tx(), "verify")
    expect(r.status).toBe("duplicate")
    expect(db.updateDocument).not.toHaveBeenCalled()
  })

  it.each([{ status: "failed" }, { status: "abandoned" }, { amount: 1 }, { currency: "GHS" }])("never grants access for %o", async (over) => {
    const r = await applyVerifiedCharge(tx(over), "webhook")
    expect(r.status).toBe("rejected")
    expect(db.createDocument).not.toHaveBeenCalled()
    expect(db.updateDocument).not.toHaveBeenCalled()
  })

  it("rejects a transaction that belongs to another user on the verify path", async () => {
    const r = await applyVerifiedCharge(tx(), "verify", { expectedUserId: "someone-else" })
    expect(r.status).toBe("rejected")
    expect(db.updateDocument).not.toHaveBeenCalled()
  })

  it("reports user_not_found without granting", async () => {
    db.getDocument.mockRejectedValue({ code: 404 })
    db.listDocuments.mockResolvedValue({ documents: [] })
    expect((await applyVerifiedCharge(tx(), "webhook")).status).toBe("user_not_found")
    expect(db.createDocument).not.toHaveBeenCalled()
  })

  it("releases the idempotency claim if the user update fails", async () => {
    db.updateDocument.mockRejectedValue(new Error("appwrite down"))
    await expect(applyVerifiedCharge(tx(), "webhook")).rejects.toThrow("appwrite down")
    expect(db.deleteDocument).toHaveBeenCalledWith("testdb", "paymentEvents", paymentEventId("ref_123"))
  })
})
