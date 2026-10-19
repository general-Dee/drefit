"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Flame, CalendarCheck, Award, TrendingUp, Play } from "lucide-react"
import CountUp from "@/components/ui/CountUp"
import ProgressRing from "@/components/ui/ProgressRing"
import Skeleton from "@/components/ui/Skeleton"
import PageHeader from "@/components/ui/PageHeader"
import StatCard from "@/components/ui/StatCard"
import { DashboardSkeleton } from "@/components/ui/skeletons"
import CoachWhatsAppButton from "@/components/CoachWhatsAppButton"
import FirstWeekCard from "@/components/FirstWeekCard"

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

  if (status === "loading") return <DashboardSkeleton />
  if (!session) return null

  const delta = stats?.progressDeltaKg ?? null
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  const toGo = stats ? Math.max(0, stats.weeklyGoal - stats.workoutsThisWeek) : 0

  return (
    <div className="page-shell space-y-4 md:space-y-6">
      <PageHeader
        eyebrow={greeting}
        title={<>Welcome back, {userName || "Athlete"}</>}
        subtitle="Here's how your week is shaping up."
        action={<CoachWhatsAppButton />}
      />

      {/* Weekly goal hero: the one primary action on this screen */}
      <section className="glass-card fade-up overflow-hidden p-5 sm:p-6">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-accent-fade" />
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-5">
            {stats ? (
              <ProgressRing
                value={stats.workoutsThisWeek}
                max={stats.weeklyGoal}
                size={88}
                stroke={8}
                label={<span className="font-display text-lg font-semibold tracking-tight">{stats.workoutsThisWeek}<span className="text-ink-subtle">/{stats.weeklyGoal}</span></span>}
              />
            ) : (
              <Skeleton className="h-[88px] w-[88px] rounded-full" />
            )}
            <div className="min-w-0">
              <div className="eyebrow">Weekly goal</div>
              <div className="mt-1.5 font-display text-xl font-semibold tracking-tight">
                {stats ? (toGo === 0 ? "Goal smashed this week" : `${toGo} workout${toGo === 1 ? "" : "s"} to go`) : <Skeleton className="h-7 w-44 rounded-md" />}
              </div>
              <p className="mt-1 text-sm text-ink-muted">
                {stats && stats.streakDays === 0 ? "No streak yet. Train today to start one." : "Keep the momentum going."}
              </p>
            </div>
          </div>
          <Link href="/dashboard/workouts" className="btn-primary sm:ml-auto">
            <Play className="h-4 w-4 fill-current" /> Start a workout
          </Link>
        </div>
      </section>

      <div className="stagger grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <StatCard icon={Flame} label="Calories today" loading={!stats}>
          {stats && <><CountUp value={stats.caloriesToday} /><span className="stat-unit">kcal</span></>}
        </StatCard>
        <StatCard icon={CalendarCheck} label="This week" loading={!stats}>
          {stats && <><CountUp value={stats.workoutsThisWeek} /><span className="text-ink-subtle">/{stats.weeklyGoal}</span><span className="stat-unit">workouts</span></>}
        </StatCard>
        <StatCard icon={Award} label="Streak" loading={!stats} hint={stats && stats.streakDays === 0 ? "Start one today" : undefined}>
          {stats && <><CountUp value={stats.streakDays} /><span className="stat-unit">day{stats.streakDays === 1 ? "" : "s"}</span></>}
        </StatCard>
        <StatCard icon={TrendingUp} label="Progress" loading={!stats} hint={stats && delta == null ? "Log your weight" : undefined}>
          {stats && (delta == null ? <span className="text-ink-subtle">—</span> : <><CountUp value={delta} decimals={1} prefix={delta > 0 ? "+" : ""} /><span className="stat-unit">kg</span></>)}
        </StatCard>
      </div>
      <FirstWeekCard />
    </div>
  )
}
