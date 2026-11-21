import { describe, it, expect, vi } from "vitest"
import { enqueueCompletion, flushQueue, newClientId, readQueue, writeQueue, QUEUE_KEY, type KV } from "./offline-queue"
import { resolveCompletedAt } from "./completion-time"
import { readFileSync } from "node:fs"
import { join } from "node:path"

function memory(): KV & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) }
}
const entry = (id: string) => ({ clientId: id, workoutId: "w1", completedAt: "2026-10-17T08:00:00.000Z" })

describe("offline completion queue", () => {
  it("enqueues without duplicates and survives bad storage", () => {
    const s = memory()
    enqueueCompletion(s, entry("c1"))
    enqueueCompletion(s, entry("c1"))
    enqueueCompletion(s, entry("c2"))
    expect(readQueue(s).map((e) => e.clientId)).toEqual(["c1", "c2"])
    s.setItem(QUEUE_KEY, "{not json")
    expect(readQueue(s)).toEqual([])
  })

  it("syncs on success/409 and keeps entries on network or server errors", async () => {
    const s = memory()
    writeQueue(s, [entry("c1"), entry("c2"), entry("c3"), entry("c4"), entry("c5")])
    const post = vi.fn(async (e: { clientId: string }) => {
      if (e.clientId === "c1") return { ok: true, status: 200 }
      if (e.clientId === "c2") return { ok: false, status: 409 }
      if (e.clientId === "c3") throw new TypeError("Failed to fetch")
      if (e.clientId === "c4") return { ok: false, status: 503 }
      return { ok: false, status: 402 } // lapsed subscription: dropped
    })
    expect(await flushQueue(s, post)).toEqual({ synced: 2, remaining: 2 })
    expect(readQueue(s).map((e) => e.clientId)).toEqual(["c3", "c4"])
    const ok = vi.fn(async () => ({ ok: true, status: 200 }))
    expect(await flushQueue(s, ok)).toEqual({ synced: 2, remaining: 0 })
  })

  it("client ids are valid Appwrite document ids", () => {
    const id = newClientId(() => "123e4567-e89b-12d3-a456-426614174000")
    expect(id).toMatch(/^c[a-f0-9]{1,35}$/)
    expect(id.length).toBeLessThanOrEqual(36)
  })
})

describe("resolveCompletedAt", () => {
  const now = new Date("2026-10-17T12:00:00Z")
  it("accepts a plausible offline time", () => {
    expect(resolveCompletedAt("2026-10-16T08:00:00.000Z", now)).toBe("2026-10-16T08:00:00.000Z")
  })
  it("rejects future, too-old or invalid times", () => {
    expect(resolveCompletedAt("2026-10-18T08:00:00Z", now)).toBe(now.toISOString())
    expect(resolveCompletedAt("2026-09-01T08:00:00Z", now)).toBe(now.toISOString())
    expect(resolveCompletedAt("nope", now)).toBe(now.toISOString())
    expect(resolveCompletedAt(undefined, now)).toBe(now.toISOString())
  })
})

describe("service worker caching rules", () => {
  const sw = readFileSync(join(__dirname, "..", "..", "public", "sw.js"), "utf8")
  it("never caches auth, payment, subscription or settings routes", () => {
    for (const p of ["api\\/auth", "api\\/paystack", "subscription", "api\\/settings", "api\\/register", "login"]) {
      expect(sw).toContain(`/^\\/${p}(\\/|$)/`)
    }
    expect(sw).toContain('if (request.method !== "GET") return')
  })
  it("uses stale-while-revalidate for the workouts API", () => {
    expect(sw).toMatch(/isWorkoutsApi\(path\)\) \{\s*event\.respondWith\(staleWhileRevalidate/)
  })
})
