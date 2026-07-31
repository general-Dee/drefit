import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { PLAN_AMOUNT_KOBO, PLAN_CURRENCY } from "@/lib/paystack/plan"

export async function POST() {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: session.user.email,
      amount: PLAN_AMOUNT_KOBO,
      currency: PLAN_CURRENCY,
      callback_url: `${process.env.NEXTAUTH_URL}/dashboard`,
    }),
  })

  const data = await response.json()

  if (!response.ok || !data.status) {
    return NextResponse.json({ error: data.message || "Failed to initialize transaction" }, { status: 502 })
  }

  return NextResponse.json({ access_code: data.data.access_code, reference: data.data.reference })
}
