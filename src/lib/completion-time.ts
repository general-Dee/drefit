const MAX_BACKDATE_MS = 7 * 86_400_000
const MAX_CLOCK_SKEW_MS = 5 * 60_000

// Accept a client-reported completion time (offline sync) only if it is
// plausible: not in the future (beyond small clock skew) and at most 7 days
// old. Otherwise use the server time.
export function resolveCompletedAt(clientIso: string | undefined, now: Date): string {
  if (!clientIso) return now.toISOString()
  const t = new Date(clientIso).getTime()
  if (Number.isNaN(t)) return now.toISOString()
  if (t > now.getTime() + MAX_CLOCK_SKEW_MS || t < now.getTime() - MAX_BACKDATE_MS) return now.toISOString()
  return new Date(Math.min(t, now.getTime())).toISOString()
}
