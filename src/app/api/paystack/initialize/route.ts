import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
export async function POST() {
  const session = await getServerSession()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email: session.user.email, amount: 5000 * 100, currency: "NGN", callback_url: `${process.env.NEXTAUTH_URL}/dashboard` })
  })
  const data = await res.json()
  return NextResponse.json(data)
}
