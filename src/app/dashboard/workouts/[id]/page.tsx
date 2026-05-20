"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import confetti from "canvas-confetti"
import { ArrowLeft, CheckCircle } from "lucide-react"
import toast from "react-hot-toast"

const exercises = [
  { name: "Push-Ups", sets: 3, reps: 12, rest: 60 },
  { name: "Dumbbell Press", sets: 4, reps: 10, rest: 60 },
  { name: "Incline Push-Ups", sets: 3, reps: 10, rest: 45 }
]

export default function WorkoutDetail() {
  const router = useRouter()
  const [completed, setCompleted] = useState<string[]>([])
  const markComplete = (name: string) => {
    setCompleted([...completed, name])
    toast.success(`${name} completed!`)
    if (completed.length + 1 === exercises.length) {
      confetti({ particleCount: 150, spread: 70, colors: ["#C8F135","#0D0DDD"] })
      toast.success("🎉 Workout complete!")
    }
  }
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button onClick={()=>router.back()} className="flex items-center gap-2 text-drefit-lime mb-4">
        <ArrowLeft className="w-4 h-4"/> Back
      </button>
      <h1 className="text-3xl mb-4">Upper Body Strength</h1>
      <div className="space-y-3">
        {exercises.map((ex, i) => (
          <motion.div key={ex.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i*0.1 }} className="glass-card p-4 flex justify-between items-center">
            <div>
              <h3 className="font-bold">{ex.name}</h3>
              <p className="text-sm text-gray-400">{ex.sets} sets x {ex.reps} reps • {ex.rest}s rest</p>
            </div>
            {completed.includes(ex.name) ? <CheckCircle className="text-drefit-lime w-6 h-6"/> : <button onClick={()=>markComplete(ex.name)} className="px-4 py-1 bg-drefit-lime text-drefit-dark rounded-lg">Done</button>}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
