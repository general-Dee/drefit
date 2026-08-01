"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import confetti from "canvas-confetti"
import { ArrowLeft, CheckCircle, Clock, Flame } from "lucide-react"
import { format } from "date-fns"
import toast from "react-hot-toast"
import type { Exercise, WorkoutDoc } from "@/lib/appwrite/schema"

export const dynamic = "force-dynamic"

export default function WorkoutDetail({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [workout, setWorkout] = useState<WorkoutDoc | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [completionCount, setCompletionCount] = useState(0)
  const [lastCompletedAt, setLastCompletedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [completed, setCompleted] = useState<string[]>([])

  useEffect(() => {
    fetch(`/api/workouts/${params.id}`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || "Could not load workout")
          router.push("/dashboard/workouts")
          return
        }
        setWorkout(data.workout)
        setExercises(JSON.parse(data.workout.exercisesJson))
        setCompletionCount(data.completionCount)
        setLastCompletedAt(data.lastCompletedAt)
      })
      .finally(() => setLoading(false))
  }, [params.id])

  const markComplete = async (name: string) => {
    const next = [...completed, name]
    setCompleted(next)
    toast.success(`${name} completed!`)
    if (next.length === exercises.length) {
      confetti({ particleCount: 150, spread: 70, colors: ["#C8F135", "#0D0DDD"] })
      toast.success("🎉 Workout complete!")
      const res = await fetch(`/api/workouts/${params.id}/complete`, { method: "POST" })
      if (res.ok) {
        setCompletionCount((c) => c + 1)
        setLastCompletedAt(new Date().toISOString())
      }
    }
  }

  if (loading) {
    return <div className="p-6 max-w-2xl mx-auto text-gray-400">Loading...</div>
  }
  if (!workout) return null

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-drefit-lime mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <h1 className="text-3xl mb-2">{workout.name}</h1>
      <div className="flex gap-2 text-sm text-gray-400 mb-1">
        <Clock className="w-4 h-4" />
        {workout.duration} mins <Flame className="w-4 h-4 ml-2" />
        {workout.calories} cal
      </div>
      {completionCount > 0 && lastCompletedAt && (
        <p className="text-sm text-gray-400 mb-4">
          Completed {completionCount}× — last on {format(new Date(lastCompletedAt), "MMM d, yyyy")}
        </p>
      )}
      <div className="space-y-3 mt-4">
        {exercises.map((ex, i) => (
          <motion.div
            key={ex.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-4 flex justify-between items-center"
          >
            <div>
              <h3 className="font-bold">{ex.name}</h3>
              <p className="text-sm text-gray-400">
                {ex.sets} sets x {ex.reps} reps • {ex.rest}s rest
              </p>
            </div>
            {completed.includes(ex.name) ? (
              <CheckCircle className="text-drefit-lime w-6 h-6" />
            ) : (
              <button onClick={() => markComplete(ex.name)} className="px-4 py-1 bg-drefit-lime text-drefit-dark rounded-lg">
                Done
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
