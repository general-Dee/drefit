"use client"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Search, Clock, Flame } from "lucide-react"
import type { WorkoutDoc } from "@/lib/appwrite/schema"

export const dynamic = "force-dynamic"

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
        <p className="text-gray-400">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-400">No workouts found.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((w) => (
            <motion.div key={w.$id} className="glass-card p-4">
              <h3 className="text-xl">{w.name}</h3>
              <div className="flex gap-2 text-sm text-gray-400 mt-2">
                <Clock className="w-4 h-4" />
                {w.duration} mins <Flame className="w-4 h-4 ml-2" />
                {w.calories} cal
              </div>
              <Link href={`/dashboard/workouts/${w.$id}`} className="inline-block mt-3 text-drefit-lime">
                View →
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
