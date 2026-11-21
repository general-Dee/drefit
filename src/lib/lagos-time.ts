// Africa/Lagos is UTC+1 all year (no DST), but we use Intl so the logic stays
// correct and explicit.
export const APP_TIME_ZONE = "Africa/Lagos"

const dateFmt = new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" })
const hourFmt = new Intl.DateTimeFormat("en-GB", { timeZone: APP_TIME_ZONE, hour: "2-digit", hourCycle: "h23" })
const weekdayFmt = new Intl.DateTimeFormat("en-US", { timeZone: APP_TIME_ZONE, weekday: "short" })

// "YYYY-MM-DD" calendar day in Lagos.
export function lagosDateKey(d: Date): string {
  return dateFmt.format(d)
}

export function lagosHour(d: Date): number {
  return Number(hourFmt.format(d)) % 24
}

// 0 = Monday … 6 = Sunday, in Lagos.
export function lagosWeekdayIndex(d: Date): number {
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(weekdayFmt.format(d))
}

function keyToUtcMidnight(key: string): number {
  const [y, m, d] = key.split("-").map(Number)
  return Date.UTC(y, m - 1, d)
}

// Whole calendar days from `from` to `to` in Lagos (e.g. tomorrow = 1).
export function lagosDayDiff(from: Date, to: Date): number {
  return Math.round((keyToUtcMidnight(lagosDateKey(to)) - keyToUtcMidnight(lagosDateKey(from))) / 86_400_000)
}

export function addDaysToKey(key: string, days: number): string {
  const t = keyToUtcMidnight(key) + days * 86_400_000
  return new Date(t).toISOString().slice(0, 10)
}
