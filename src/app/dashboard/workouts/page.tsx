"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Search, Clock, Flame } from "lucide-react"

const workouts = [
  { id: 1, name: "Upper Body Strength", muscleGroup: "Upper Body", duration: 45, difficulty: "Intermediate", calories: 350 },
  { id: 2, name: "Leg Day Blast", muscleGroup: "Lower Body", duration: 50, difficulty: "Advanced", calories: 450 },
  { id: 3, name: "Core Crusher", muscleGroup: "Core", duration: 30, difficulty: "Beginner", calories: 200 },
]
export default function WorkoutsPage() {
  const [search, setSearch] = useState("")
  const filtered = workouts.filter(w => w.name.toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl">Workout Plans</h1>
      <div className="relative"><Search className="absolute left-3 top-3 text-gray-400 w-5 h-5"/><input type="text" placeholder="Search workouts..." className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 focus:border-drefit-lime outline-none" value={search} onChange={e=>setSearch(e.target.value)}/></div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(w => <motion.div key={w.id} className="glass-card p-4"><h3 className="text-xl">{w.name}</h3><div className="flex gap-2 text-sm text-gray-400 mt-2"><Clock className="w-4 h-4"/>{w.duration} mins <Flame className="w-4 h-4 ml-2"/>{w.calories} cal</div><Link href={`/dashboard/workouts/${w.id}`} className="inline-block mt-3 text-drefit-lime">View →</Link></motion.div>)}
      </div>
    </div>
  )
}
