import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { hasActiveAccess } from "@/lib/subscription"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  if (!hasActiveAccess(session.user.subscriptionStatus, session.user.trialEndsAt, session.user.subscriptionCurrentPeriodEnd)) {
    redirect("/subscription")
  }

  return <>{children}</>
}
