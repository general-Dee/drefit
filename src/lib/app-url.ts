// Public origin of the app, for links in emails and Paystack callbacks.
// Order: explicit NEXTAUTH_URL / AUTH_URL (production) -> the request's own
// origin (Preview deployments, where NEXTAUTH_URL is intentionally unset) ->
// VERCEL_URL -> localhost for dev.
export function appOrigin(req?: { nextUrl?: { origin: string } } | null, env: NodeJS.ProcessEnv = process.env): string {
  const configured = env.NEXTAUTH_URL || env.AUTH_URL
  if (configured) return configured.replace(/\/$/, "")
  if (req?.nextUrl?.origin) return req.nextUrl.origin
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`
  return "http://localhost:3000"
}
