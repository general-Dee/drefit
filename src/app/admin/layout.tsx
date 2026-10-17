import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import DashboardNav from "@/components/DashboardNav"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "admin") redirect("/dashboard")

  return (
    <>
      <DashboardNav role={session.user.role} />
      {children}
    </>
  )
}
