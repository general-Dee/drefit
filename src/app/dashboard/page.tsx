"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Flame, Calendar, Award, TrendingUp } from "lucide-react"
import CoachWhatsAppButton from "@/components/CoachWhatsAppButton"

export const dynamic = 'force-dynamic'

interface DashboardStats {
  caloriesToday: number
  workoutsThisWeek: number
  weeklyGoal: number
  streakDays: number
  progressDeltaKg: number | null
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [userName, setUserName] = useState("")
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (session?.user?.name) setUserName(session.user.name.split(" ")[0])
  }, [status, session])

  useEffect(() => {
    if (status !== "authenticated") return
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
  }, [status])

  if (status === "loading") return <div className="text-center mt-20">Loading...</div>
  if (!session) return null

  const progressLabel =
    stats?.progressDeltaKg == null
      ? "No data yet"
      : `${stats.progressDeltaKg > 0 ? "+" : ""}${stats.progressDeltaKg.toFixed(1)}kg`

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl">Welcome back, {userName || "Athlete"}! 💪</h1>
        <CoachWhatsAppButton />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 flex items-center gap-3">
          <Flame className="text-drefit-lime"/> Calories Today: {stats ? stats.caloriesToday.toLocaleString() : "—"}
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <Calendar className="text-drefit-lime"/> Workouts: {stats ? `${stats.workoutsThisWeek}/${stats.weeklyGoal}` : "—"}
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <Award className="text-drefit-lime"/> Streak: {stats ? `${stats.streakDays} day${stats.streakDays === 1 ? "" : "s"}` : "—"}
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <TrendingUp className="text-drefit-lime"/> Progress: {stats ? progressLabel : "—"}
        </div>
      </div>
    </div>
  )
}
