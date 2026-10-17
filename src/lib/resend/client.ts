import { Resend } from "resend"

// Created lazily so `next build` (which evaluates route modules) doesn't need
// RESEND_API_KEY; a missing key only fails when an email is actually sent.
let client: Resend | null = null

export function getResend(): Resend {
  if (!client) {
    const key = process.env.RESEND_API_KEY
    if (!key) throw new Error("RESEND_API_KEY is not set")
    client = new Resend(key)
  }
  return client
}
