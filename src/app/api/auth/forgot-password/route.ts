import { NextRequest, NextResponse } from "next/server"
import { randomBytes, createHash } from "crypto"
import { Query } from "@/lib/db/query"
import { z } from "zod"
import { db } from "@/lib/db/client"
import { appOrigin } from "@/lib/app-url"
import { USERS_COLLECTION_ID } from "@/lib/db/schema"
import { sendPasswordResetEmail } from "@/lib/resend/password-reset"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

const forgotSchema = z.object({ email: z.string().email() })

const GENERIC_RESPONSE = {
  success: true,
  message: "If an account exists for that email, we've sent a reset link.",
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  if (!rateLimit(`forgot-password:${ip}`, 5, 60_000).success) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  const parsed = forgotSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Please provide a valid email." }, { status: 400 })
  }

  try {
    const existing = await db.listDocuments(USERS_COLLECTION_ID, [
      Query.equal("email", parsed.data.email),
    ])
    const user = existing.documents[0]

    if (user) {
      const rawToken = randomBytes(32).toString("hex")
      const tokenHash = createHash("sha256").update(rawToken).digest("hex")
      const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString()

      await db.updateDocument(USERS_COLLECTION_ID, user.$id, {
        passwordResetTokenHash: tokenHash,
        passwordResetExpires: expires,
      })

      const resetUrl = `${appOrigin(req)}/reset-password?token=${rawToken}`
      await sendPasswordResetEmail(parsed.data.email, resetUrl).catch((err) => {
        console.error("password reset email failed", err)
      })
    }
  } catch (err) {
    console.error("forgot-password failed", err)
  }

  // Always the same response, whether or not the email exists, to avoid user enumeration.
  return NextResponse.json(GENERIC_RESPONSE)
}
