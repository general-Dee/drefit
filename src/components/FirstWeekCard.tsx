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
    <section className="glass-card p-4 space-y-3" data-testid="first-week-card">
      <div className="flex items-center gap-2">
        <CalendarCheck className="text-drefit-lime" />
        <h2 className="text-xl">Your first week</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {data.plan.days.map((d) => {
          const isToday = d.date === data.today
          const body =
            d.type === "workout" ? (
              <>
                <div className="font-medium text-sm">{d.workout?.name}</div>
                <div className="text-xs text-gray-400 tabular-nums">{d.workout?.duration} min</div>
              </>
            ) : (
              <div className="text-sm text-gray-400">{d.type === "mobility" ? "Mobility" : "Rest"}</div>
            )
          const cls = `block rounded-lg border p-2 ${isToday ? "border-drefit-lime bg-drefit-lime/10" : "border-white/10 bg-white/5"}`
          return d.type === "workout" && d.workout ? (
            <Link key={d.day} href={`/dashboard/workouts/${d.workout.id}`} className={cls}>
              <div className="text-xs text-gray-400">Day {d.day} · {d.weekday.slice(0, 3)}{isToday ? " · Today" : ""}</div>
              {body}
            </Link>
          ) : (
            <div key={d.day} className={cls}>
              <div className="text-xs text-gray-400">Day {d.day} · {d.weekday.slice(0, 3)}{isToday ? " · Today" : ""}</div>
              {body}
            </div>
          )
        })}
      </div>
      {data.plan.notes.length > 0 && <p className="text-xs text-gray-500">{data.plan.notes[0]}</p>}
    </section>
  )
}
