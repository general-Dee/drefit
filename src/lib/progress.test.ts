import { describe, it, expect } from "vitest"
import { computeStreaks, summarizeWeights } from "./progress"

// Lagos is UTC+1: 23:30Z on the 16th is 00:30 on the 17th in Lagos.
const NOW = new Date("2026-10-17T10:00:00Z")

describe("computeStreaks (Africa/Lagos)", () => {
  it("is zero with no completions", () => {
    expect(computeStreaks([], NOW)).toEqual({ current: 0, best: 0, activeDays: 0, lastActiveDay: null })
  })

  it("counts consecutive days ending today", () => {
    const s = computeStreaks(["2026-10-15T08:00:00Z", "2026-10-16T08:00:00Z", "2026-10-17T08:00:00Z"], NOW)
    expect(s.current).toBe(3)
    expect(s.best).toBe(3)
  })

  it("keeps yesterday's streak alive before today's workout", () => {
    expect(computeStreaks(["2026-10-15T08:00:00Z", "2026-10-16T08:00:00Z"], NOW).current).toBe(2)
  })

  it("resets when the last workout was 2+ days ago, keeping best", () => {
    const s = computeStreaks(["2026-10-01T08:00:00Z", "2026-10-02T08:00:00Z", "2026-10-03T08:00:00Z", "2026-10-14T08:00:00Z"], NOW)
    expect(s.current).toBe(0)
    expect(s.best).toBe(3)
  })

  it("buckets by Lagos day, not UTC", () => {
    // 23:30Z on the 16th = 00:30 on the 17th in Lagos, so this is "today".
    const s = computeStreaks(["2026-10-16T23:30:00Z"], NOW)
    expect(s.lastActiveDay).toBe("2026-10-17")
    expect(s.current).toBe(1)
    // 22:30Z on the 16th = 23:30 on the 16th in Lagos ("yesterday").
    expect(computeStreaks(["2026-10-16T22:30:00Z"], NOW).lastActiveDay).toBe("2026-10-16")
  })

  it("counts several workouts in a day once and handles month boundaries", () => {
    const s = computeStreaks(["2026-09-30T07:00:00Z", "2026-09-30T18:00:00Z", "2026-10-01T07:00:00Z"], new Date("2026-10-01T12:00:00Z"))
    expect(s).toMatchObject({ current: 2, best: 2, activeDays: 2 })
  })
})

describe("summarizeWeights", () => {
  it("handles no data", () => {
    expect(summarizeWeights([])).toMatchObject({ points: [], changeKg: null, trendKgPerWeek: null })
  })

  it("computes change since start and weekly trend from unsorted logs", () => {
    const s = summarizeWeights([
      { loggedAt: "2026-10-15T08:00:00Z", weight: 88 },
      { loggedAt: "2026-10-01T08:00:00Z", weight: 90 },
      { loggedAt: "2026-10-08T08:00:00Z", weight: 89 },
    ])
    expect(s.startWeight).toBe(90)
    expect(s.latestWeight).toBe(88)
    expect(s.changeKg).toBe(-2)
    expect(s.trendKgPerWeek).toBe(-1)
    expect(s.points.map((p) => p.trend)).toEqual([90, 89, 88])
  })

  it("single entry has no change or trend", () => {
    const s = summarizeWeights([{ loggedAt: "2026-10-01T08:00:00Z", weight: 70 }])
    expect(s.changeKg).toBeNull()
    expect(s.trendKgPerWeek).toBeNull()
  })
})
