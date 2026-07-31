"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Flame, Calendar, Award, TrendingUp } from "lucide-react"

export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [userName, setUserName] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (session?.user?.name) setUserName(session.user.name.split(" ")[0])
  }, [status, session])

  if (status === "loading") return <div className="text-center mt-20">Loading...</div>
  if (!session) return null

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl">Welcome back, {userName || "Athlete"}! 💪</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 flex items-center gap-3"><Flame className="text-drefit-lime"/> Calories Today: 1,280</div>
        <div className="glass-card p-4 flex items-center gap-3"><Calendar className="text-drefit-lime"/> Workouts: 4/7</div>
        <div className="glass-card p-4 flex items-center gap-3"><Award className="text-drefit-lime"/> Streak: 12 days</div>
        <div className="glass-card p-4 flex items-center gap-3"><TrendingUp className="text-drefit-lime"/> Progress: -2.5kg</div>
      </div>
    </div>
  )
}
