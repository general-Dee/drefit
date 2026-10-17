import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { serverDatabases } from "@/lib/appwrite/server"
import { DATABASE_ID, USERS_COLLECTION_ID, type AppwriteUserDoc } from "@/lib/appwrite/schema"
import { normalizePhone } from "@/lib/phone"
import { DEFAULT_REMINDER_HOUR } from "@/lib/whatsapp/reminders"

const schema = z.object({
  phone: z.string().trim().max(30).optional().nullable(),
  whatsappOptIn: z.boolean(),
  reminderHour: z.number().int().min(0).max(23),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = (await serverDatabases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, session.user.id)) as unknown as AppwriteUserDoc
  return NextResponse.json({
    phone: user.phone ?? "",
    whatsappOptIn: user.whatsappOptIn ?? false,
    reminderHour: user.reminderHour ?? DEFAULT_REMINDER_HOUR,
  })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid reminder settings." }, { status: 400 })

  const raw = parsed.data.phone ?? ""
  const phone = raw ? normalizePhone(raw) : null
  if (raw && !phone) {
    return NextResponse.json({ error: "Enter a valid phone number, e.g. 0803 123 4567 or +234 803 123 4567." }, { status: 400 })
  }
  if (parsed.data.whatsappOptIn && !phone) {
    return NextResponse.json({ error: "Add your WhatsApp number to turn on reminders." }, { status: 400 })
  }

  await serverDatabases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, session.user.id, {
    phone,
    whatsappOptIn: parsed.data.whatsappOptIn,
    reminderHour: parsed.data.reminderHour,
  })
  return NextResponse.json({ success: true, phone })
}
