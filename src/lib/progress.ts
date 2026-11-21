import { addDaysToKey, lagosDateKey } from "@/lib/lagos-time"

export interface Streaks {
  current: number
  best: number
  activeDays: number
  lastActiveDay: string | null
}

// Streaks over Lagos calendar days with at least one completed workout.
// The current streak counts back from today, or from yesterday if today has
// no completion yet (so it doesn't reset before the user has trained today).
export function computeStreaks(completedAt: string[], now: Date): Streaks {
  const days = new Set<string>()
  for (const iso of completedAt) {
    const d = new Date(iso)
    if (!Number.isNaN(d.getTime())) days.add(lagosDateKey(d))
  }
  const sorted = [...days].sort()

  let best = 0
  let run = 0
  let prev: string | null = null
  for (const day of sorted) {
    run = prev && addDaysToKey(prev, 1) === day ? run + 1 : 1
    best = Math.max(best, run)
    prev = day
  }

  const today = lagosDateKey(now)
  let cursor = days.has(today) ? today : addDaysToKey(today, -1)
  let current = 0
  while (days.has(cursor)) {
    current += 1
    cursor = addDaysToKey(cursor, -1)
  }

  return { current, best, activeDays: days.size, lastActiveDay: sorted[sorted.length - 1] ?? null }
}

export interface WeightPoint {
  loggedAt: string
  weight: number
}

export interface WeightSummary {
  points: { date: string; weight: number; trend: number }[]
  startWeight: number | null
  latestWeight: number | null
  changeKg: number | null
  // Least-squares slope, kg per week (negative = losing).
  trendKgPerWeek: number | null
}

const WEEK_MS = 7 * 86_400_000

export function summarizeWeights(logs: WeightPoint[]): WeightSummary {
  const pts = logs
    .map((l) => ({ t: new Date(l.loggedAt).getTime(), w: Number(l.weight), iso: l.loggedAt }))
    .filter((p) => !Number.isNaN(p.t) && Number.isFinite(p.w) && p.w > 0)
    .sort((a, b) => a.t - b.t)

  if (pts.length === 0) return { points: [], startWeight: null, latestWeight: null, changeKg: null, trendKgPerWeek: null }

  let slopePerMs = 0
  let intercept = pts[0].w
  if (pts.length >= 2) {
    const n = pts.length
    const t0 = pts[0].t
    const xs = pts.map((p) => p.t - t0)
    const mx = xs.reduce((a, b) => a + b, 0) / n
    const my = pts.reduce((a, p) => a + p.w, 0) / n
    const sxx = xs.reduce((a, x) => a + (x - mx) ** 2, 0)
    const sxy = xs.reduce((a, x, i) => a + (x - mx) * (pts[i].w - my), 0)
    slopePerMs = sxx === 0 ? 0 : sxy / sxx
    intercept = my - slopePerMs * mx
  }
  const t0 = pts[0].t
  const round = (v: number) => Math.round(v * 10) / 10

  return {
    points: pts.map((p) => ({ date: p.iso, weight: p.w, trend: round(intercept + slopePerMs * (p.t - t0)) })),
    startWeight: pts[0].w,
    latestWeight: pts[pts.length - 1].w,
    changeKg: pts.length >= 2 ? round(pts[pts.length - 1].w - pts[0].w) : null,
    trendKgPerWeek: pts.length >= 2 ? round(slopePerMs * WEEK_MS) : null,
  }
}
