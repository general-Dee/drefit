import { NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { ID, Query } from "@/lib/db/query"
import { z } from "zod"
import { db } from "@/lib/db/client"
import { USERS_COLLECTION_ID } from "@/lib/db/schema"
import { TRIAL_DAYS } from "@/lib/paystack/plan"
import { rateLimit, getClientIp } from "@/lib/rate-limit"
import { isAdminEmail } from "@/lib/admin"
import { generateReferralCode, resolveReferrerId, REFERRAL_COOKIE } from "@/lib/referrals"

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  ref: z.string().max(32).optional().nullable(),
})

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  if (!rateLimit(`register:${ip}`, 5, 60_000).success) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Please provide a valid name, email, and password (min 6 characters)." }, { status: 400 })
  }

  const { name, email, password, ref } = parsed.data

  try {
    const existing = await db.listDocuments(USERS_COLLECTION_ID, [
      Query.equal("email", email),
    ])
    if (existing.documents.length > 0) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 })
    }

    const referredBy = await resolveReferrerId(ref ?? req.cookies.get(REFERRAL_COOKIE)?.value, email)
    const hashedPassword = await hash(password, 10)
    const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString()

    await db.createDocument(USERS_COLLECTION_ID, ID.unique(), {
      name,
      email,
      password: hashedPassword,
      role: isAdminEmail(email) ? "admin" : "user",
      subscriptionStatus: "trialing",
      trialEndsAt,
      referralCode: generateReferralCode(),
      ...(referredBy ? { referredBy } : {}),
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("register failed", err)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
