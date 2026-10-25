import { NextRequest, NextResponse } from "next/server"
import { createHash } from "crypto"
import { hash } from "bcryptjs"
import { Query } from "@/lib/db/query"
import { z } from "zod"
import { db } from "@/lib/db/client"
import { USERS_COLLECTION_ID } from "@/lib/db/schema"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
})

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  if (!rateLimit(`reset-password:${ip}`, 5, 60_000).success) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  const parsed = resetSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }

  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex")

  try {
    const existing = await db.listDocuments(USERS_COLLECTION_ID, [
      Query.equal("passwordResetTokenHash", tokenHash),
    ])
    const user = existing.documents[0]

    if (!user || !user.passwordResetExpires || new Date(user.passwordResetExpires) < new Date()) {
      return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 })
    }

    const hashedPassword = await hash(parsed.data.password, 10)
    await db.updateDocument(USERS_COLLECTION_ID, user.$id, {
      password: hashedPassword,
      passwordResetTokenHash: "",
      passwordResetExpires: "",
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("reset-password failed", err)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
