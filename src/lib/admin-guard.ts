import { NextResponse } from "next/server"
import type { Session } from "next-auth"
import { auth } from "@/lib/auth"

type AdminSession = Session

type AdminGuardResult =
  | { error: NextResponse; session?: undefined }
  | { error?: undefined; session: AdminSession }

export async function requireAdmin(): Promise<AdminGuardResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }
  if (session.user.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }
  return { session }
}
