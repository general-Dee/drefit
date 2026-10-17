"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { CalendarCheck } from "lucide-react"
import type { FirstWeekPlan } from "@/lib/first-week-plan"

// "Your first week" — shown on the dashboard during the free trial.
export default function FirstWeekCard() {
  const [data, setData] = useState<{ plan: FirstWeekPlan | null; show: boolean; today: string } | null>(null)

  useEffect(() => {
    fetch("/api/dashboard/first-week")
      .then((res) => (res.ok ? res.json() : null))
      .then(setData)
      .catch(() => setData(null))
  }, [])

  if (!data?.show || !data.plan) return null
  return (
    <section className="glass-card fade-up p-4 sm:p-5 space-y-4" data-testid="first-week-card">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/10 text-accent"><CalendarCheck className="h-4 w-4" /></span>
        <h2 className="text-xl font-semibold">Your first week</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {data.plan.days.map((d) => {
          const isToday = d.date === data.today
          const body =
            d.type === "workout" ? (
              <>
                <div className="font-medium text-sm">{d.workout?.name}</div>
                <div className="text-xs text-ink-muted tabular-nums">{d.workout?.duration} min</div>
              </>
            ) : (
              <div className="text-sm text-ink-muted">{d.type === "mobility" ? "Mobility" : "Rest"}</div>
            )
          const cls = `block rounded-xl border p-3 transition-transform active:scale-[0.98] ${isToday ? "border-accent/60 bg-accent/10 shadow-glow" : "border-white/[0.07] bg-white/[0.03]"}`
          return d.type === "workout" && d.workout ? (
            <Link key={d.day} href={`/dashboard/workouts/${d.workout.id}`} className={cls}>
              <div className="text-xs text-ink-muted">Day {d.day} · {d.weekday.slice(0, 3)}{isToday ? " · Today" : ""}</div>
              {body}
            </Link>
          ) : (
            <div key={d.day} className={cls}>
              <div className="text-xs text-ink-muted">Day {d.day} · {d.weekday.slice(0, 3)}{isToday ? " · Today" : ""}</div>
              {body}
            </div>
          )
        })}
      </div>
      {data.plan.notes.length > 0 && <p className="text-xs text-ink-subtle">{data.plan.notes[0]}</p>}
    </section>
  )
}
