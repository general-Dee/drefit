import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { hasActiveAccess } from "@/lib/subscription"
import DashboardNav from "@/components/DashboardNav"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  if (!hasActiveAccess(session.user.subscriptionStatus, session.user.trialEndsAt, session.user.subscriptionCurrentPeriodEnd)) {
    redirect("/subscription")
  }

  return (
    <>
      <DashboardNav role={session.user.role} />
      {children}
    </>
  )
}
