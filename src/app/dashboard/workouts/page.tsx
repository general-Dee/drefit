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
    <div className="p-6 space-y-6">
      <h1 className="text-3xl">Workout Plans</h1>
      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search workouts..."
          className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 focus:border-drefit-lime outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="glass-card p-5 h-32 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-gray-400 text-center py-12">No workouts found.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((w) => (
            <Link key={w.$id} href={`/dashboard/workouts/${w.$id}`} className="group">
              <motion.div
                whileHover={{ y: -4 }}
                className="glass-card p-5 h-full flex flex-col justify-between hover:border-drefit-lime/40 transition-colors cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xl leading-tight">{w.name}</h3>
                    <span className={`shrink-0 text-xs px-2 py-1 rounded-full ${difficultyStyles[w.difficulty] ?? "bg-white/10 text-white"}`}>
                      {w.difficulty}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{w.muscleGroup}</p>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                  <div className="flex gap-3 text-sm text-gray-400">
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
