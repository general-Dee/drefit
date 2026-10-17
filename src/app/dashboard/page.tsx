"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Flame, Calendar, Award, TrendingUp, ArrowRight } from "lucide-react"
import CountUp from "@/components/ui/CountUp"
import ProgressRing from "@/components/ui/ProgressRing"
import Skeleton from "@/components/ui/Skeleton"
import PageHeader from "@/components/ui/PageHeader"
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

  return (
    <div className="page-shell space-y-6">
      <PageHeader
        eyebrow={greeting}
        title={<>Welcome back, {userName || "Athlete"}</>}
        subtitle="Here's how your week is shaping up."
        action={<CoachWhatsAppButton />}
      />

      {/* Weekly goal hero */}
      <section className="glass-card fade-up flex items-center gap-5 p-5 sm:p-6">
        {stats ? (
          <ProgressRing
            value={stats.workoutsThisWeek}
            max={stats.weeklyGoal}
            size={88}
            stroke={8}
            label={<span className="font-display text-lg">{stats.workoutsThisWeek}/{stats.weeklyGoal}</span>}
          />
        ) : (
          <Skeleton className="h-[88px] w-[88px] rounded-full" />
        )}
        <div className="min-w-0">
          <div className="eyebrow">Weekly goal</div>
          <div className="mt-1 font-display text-xl font-semibold">
            {stats ? (stats.workoutsThisWeek >= stats.weeklyGoal ? "Goal smashed this week" : `${Math.max(0, stats.weeklyGoal - stats.workoutsThisWeek)} workout${stats.weeklyGoal - stats.workoutsThisWeek === 1 ? "" : "s"} to go`) : "Loading your week..."}
          </div>
          <Link href="/dashboard/workouts" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent">
            Start a workout <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <div className="stagger grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <StatCard icon={Flame} label="Calories today" loading={!stats}>
          {stats && <CountUp value={stats.caloriesToday} />}
        </StatCard>
        <StatCard icon={Calendar} label="Workouts this week" loading={!stats}>
          {stats && <><CountUp value={stats.workoutsThisWeek} /><span className="text-ink-subtle">/{stats.weeklyGoal}</span></>}
        </StatCard>
        <StatCard icon={Award} label="Streak" loading={!stats}>
          {stats && <><CountUp value={stats.streakDays} /> <span className="text-base text-ink-muted">day{stats.streakDays === 1 ? "" : "s"}</span></>}
        </StatCard>
        <StatCard icon={TrendingUp} label="Progress" loading={!stats}>
          {stats && (delta == null ? <span className="text-base text-ink-muted">No data yet</span> : <CountUp value={delta} decimals={1} prefix={delta > 0 ? "+" : ""} suffix="kg" />)}
        </StatCard>
      </div>
      <FirstWeekCard />
    </div>
  )
}

function StatCard({ icon: Icon, label, loading, children }: { icon: React.ComponentType<{ className?: string }>; label: string; loading: boolean; children: React.ReactNode }) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-ink-muted">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent/10 text-accent"><Icon className="h-4 w-4" /></span>
        {label}
      </div>
      <div className="stat-value mt-3">{loading ? <Skeleton className="h-8 w-20" /> : children}</div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="page-shell space-y-6" aria-busy="true">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-32 w-full" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
      </div>
    </div>
  )
}
