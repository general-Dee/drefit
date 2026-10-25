"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Search, SearchX, Clock, Flame, ChevronRight, Dumbbell } from "lucide-react"
import PageHeader from "@/components/ui/PageHeader"
import EmptyState from "@/components/ui/EmptyState"
import { WorkoutCardsSkeleton } from "@/components/ui/skeletons"
import type { WorkoutDoc } from "@/lib/db/schema"

export const dynamic = "force-dynamic"

const difficultyStyles: Record<string, string> = {
  beginner: "border-accent/30 bg-accent/10 text-accent",
  intermediate: "border-white/15 bg-white/[0.06] text-ink",
  advanced: "border-red-400/30 bg-red-500/10 text-red-300",
}

export default function WorkoutsPage() {
  const [search, setSearch] = useState("")
  const [workouts, setWorkouts] = useState<WorkoutDoc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/workouts")
      .then((res) => res.json())
      .then((data) => setWorkouts(data.workouts ?? []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = workouts.filter((w) => w.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="page-shell">
      <PageHeader eyebrow="Train" title="Workout plans" subtitle="Coach-built sessions. Pick one and press play." />
      <div className="relative mb-5">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-subtle" />
        <input
          type="search"
          placeholder="Search workouts..."
          aria-label="Search workouts"
          className="input-field pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <WorkoutCardsSkeleton />
      ) : filtered.length === 0 ? (
        <div className="glass-card">
          {workouts.length === 0 ? (
            <EmptyState icon={Dumbbell} title="No workouts yet" description="Your coach is building your library. Check back soon or message them." action={{ label: "Message your coach", href: "/dashboard/coaching" }} />
          ) : (
            <EmptyState icon={SearchX} title="No matches" description={<>Nothing matches &ldquo;{search}&rdquo;. Try a different name.</>} action={{ label: "Clear search", onClick: () => setSearch("") }} />
          )}
        </div>
      ) : (
        <div className="stagger grid gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
          {filtered.map((w) => (
            <Link key={w.$id} href={`/dashboard/workouts/${w.$id}`} className="group glass-card card-interactive flex h-full min-h-[164px] flex-col justify-between p-5">
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="line-clamp-2 text-[17px] leading-6">{w.name}</h3>
                  <span className={`chip shrink-0 capitalize ${difficultyStyles[w.difficulty] ?? ""}`}>{w.difficulty}</span>
                </div>
                <p className="mt-1 truncate text-sm text-ink-muted">{w.muscleGroup}</p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                <div className="flex gap-4 text-sm tabular-nums text-ink-muted">
                  <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {w.duration} min</span>
                  <span className="flex items-center gap-1.5"><Flame className="h-4 w-4" /> {w.calories} kcal</span>
                </div>
                <span className="grid h-8 w-8 place-items-center rounded-full bg-accent/10 text-accent transition-transform duration-base ease-out group-hover:translate-x-0.5">
                  <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
