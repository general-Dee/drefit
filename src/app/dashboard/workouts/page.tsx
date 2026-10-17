"use client"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Search, Clock, Flame, ChevronRight } from "lucide-react"
import type { WorkoutDoc } from "@/lib/appwrite/schema"

export const dynamic = "force-dynamic"

const difficultyStyles: Record<string, string> = {
  beginner: "bg-drefit-lime/20 text-drefit-lime",
  intermediate: "bg-white/10 text-white",
  advanced: "bg-red-500/20 text-red-400",
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
    <div className="page-shell space-y-6">
      <h1 className="fade-up font-bold">Workout Plans</h1>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle w-5 h-5" />
        <input
          type="text"
          placeholder="Search workouts..."
          className="input-field pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton p-5 h-32" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-ink-muted text-center py-12">No workouts found.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((w) => (
            <Link key={w.$id} href={`/dashboard/workouts/${w.$id}`} className="group">
              <motion.div
                whileHover={{ y: -4 }}
                className="glass-card p-5 h-full flex flex-col justify-between card-interactive cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xl leading-tight">{w.name}</h3>
                    <span className={`shrink-0 text-xs px-2 py-1 rounded-full ${difficultyStyles[w.difficulty] ?? "bg-white/10 text-white"}`}>
                      {w.difficulty}
                    </span>
                  </div>
                  <p className="text-sm text-ink-muted mt-1">{w.muscleGroup}</p>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                  <div className="flex gap-3 text-sm text-ink-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {w.duration}m
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-4 h-4" /> {w.calories}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-drefit-lime group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
