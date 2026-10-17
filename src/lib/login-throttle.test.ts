import { describe, it, expect, vi, beforeEach } from "vitest"

const { store, db } = vi.hoisted(() => {
  const store = new Map<string, Record<string, unknown>>()
  const db = {
  getDocument: vi.fn(async (_d: string, _c: string, id: string) => {
    const doc = store.get(id)
    if (!doc) throw { code: 404 }
    return { $id: id, ...doc }
  }),
  createDocument: vi.fn(async (_d: string, _c: string, id: string, data: Record<string, unknown>) => {
    if (store.has(id)) throw { code: 409 }
    store.set(id, data)
    return data
  }),
  updateDocument: vi.fn(async (_d: string, _c: string, id: string, data: Record<string, unknown>) => {
    store.set(id, { ...store.get(id), ...data })
    return data
  }),
  deleteDocument: vi.fn(async (_d: string, _c: string, id: string) => {
    if (!store.delete(id)) throw { code: 404 }
    return {}
  }),
}
  return { store, db }
})
vi.mock("@/lib/appwrite/server", () => ({ serverDatabases: db }))

import {
  EMAIL_POLICY,
  IP_EMAIL_POLICY,
  attemptDocId,
  clearLoginFailures,
  isLocked,
  isLoginLocked,
  recordFailureState,
  recordLoginFailure,
} from "./login-throttle"

const MIN = 60_000

describe("recordFailureState", () => {
  it("locks after maxFailures within the window", () => {
    let s = null
    const t = 1_000_000
    for (let i = 0; i < IP_EMAIL_POLICY.maxFailures - 1; i++) s = recordFailureState(s, t + i, IP_EMAIL_POLICY)
    expect(isLocked(s, t + 10)).toBe(false)
    s = recordFailureState(s, t + 10, IP_EMAIL_POLICY)
    expect(isLocked(s, t + 11)).toBe(true)
    expect(isLocked(s, t + 10 + IP_EMAIL_POLICY.lockMs + 1)).toBe(false)
  })
  it("starts a fresh window after windowMs", () => {
    const s1 = recordFailureState(null, 0, IP_EMAIL_POLICY)
    const s2 = recordFailureState({ ...s1, failures: 4 }, IP_EMAIL_POLICY.windowMs + 1, IP_EMAIL_POLICY)
    expect(s2.failures).toBe(1)
    expect(s2.lockedUntil).toBeNull()
  })
})

describe("Appwrite-backed lockout", () => {
  beforeEach(() => store.clear())

  it("locks an ip+email after 5 failures, the same for registered and unknown emails", async () => {
    for (const email of ["member@example.com", "nobody@example.com"]) {
      for (let i = 0; i < 5; i++) await recordLoginFailure("1.2.3.4", email)
      expect(await isLoginLocked("1.2.3.4", email)).toBe(true)
      expect(await isLoginLocked("5.6.7.8", email)).toBe(false)
    }
  })

  it("normalises email case/whitespace", async () => {
    for (let i = 0; i < 5; i++) await recordLoginFailure("1.2.3.4", " Member@Example.com ")
    expect(await isLoginLocked("1.2.3.4", "member@example.com")).toBe(true)
  })

  it("locks an email across IPs after the per-email limit", async () => {
    for (let i = 0; i < EMAIL_POLICY.maxFailures; i++) await recordLoginFailure(`10.0.0.${i}`, "target@example.com")
    expect(await isLoginLocked("99.9.9.9", "target@example.com")).toBe(true)
  })

  it("survives a 'cold start' because state lives in storage, not memory", async () => {
    for (let i = 0; i < 5; i++) await recordLoginFailure("1.2.3.4", "a@example.com")
    vi.resetModules()
    const fresh = await import("./login-throttle")
    expect(await fresh.isLoginLocked("1.2.3.4", "a@example.com")).toBe(true)
  })

  it("stores no raw email or IP", async () => {
    await recordLoginFailure("1.2.3.4", "a@example.com")
    const dump = JSON.stringify([...store.entries()])
    expect(dump).not.toContain("a@example.com")
    expect(dump).not.toContain("1.2.3.4")
    expect(store.has(attemptDocId("ip_email", "1.2.3.4|a@example.com"))).toBe(true)
  })

  it("clears the ip+email counter on success", async () => {
    for (let i = 0; i < 3; i++) await recordLoginFailure("1.2.3.4", "a@example.com")
    await clearLoginFailures("1.2.3.4", "a@example.com")
    expect(store.has(attemptDocId("ip_email", "1.2.3.4|a@example.com"))).toBe(false)
  })

  it("fails open if storage errors", async () => {
    db.getDocument.mockRejectedValueOnce(new Error("down"))
    expect(await isLoginLocked("1.2.3.4", "a@example.com")).toBe(false)
  })
})
