"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import confetti from "canvas-confetti"
import { ArrowLeft, CheckCircle, Clock, Flame } from "lucide-react"
import { format } from "date-fns"
import toast from "react-hot-toast"
import type { Exercise, WorkoutDoc } from "@/lib/appwrite/schema"
import { enqueueCompletion, isNetworkError, newClientId, postCompletion } from "@/lib/offline-queue"

export const dynamic = "force-dynamic"

const difficultyStyles: Record<string, string> = {
  beginner: "bg-drefit-lime/20 text-drefit-lime",
  intermediate: "bg-white/10 text-white",
  advanced: "bg-red-500/20 text-red-400",
}

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
      confetti({ particleCount: 150, spread: 70, colors: ["#C8F135", "#F5F5F4"], disableForReducedMotion: true })
      toast.success("🎉 Workout complete!")
      const entry = { clientId: newClientId(), workoutId: params.id, completedAt: new Date().toISOString() }
      try {
        if (!navigator.onLine) throw new TypeError("offline")
        const res = await postCompletion(entry)
        if (res.ok || res.status === 409) {
          setCompletionCount((c) => c + 1)
          setLastCompletedAt(entry.completedAt)
        }
      } catch (err) {
        if (!isNetworkError(err)) throw err
        // Offline: save locally; ServiceWorkerRegistrar syncs when back online.
        enqueueCompletion(window.localStorage, entry)
        window.dispatchEvent(new Event("storage"))
        setCompletionCount((c) => c + 1)
        setLastCompletedAt(entry.completedAt)
        toast("Saved offline — it will sync when you're back online.", { icon: "📶" })
      }
    }
  }

  if (loading) {
    return <div className="page-shell max-w-2xl text-ink-muted">Loading...</div>
  }
  if (!workout) return null

  return (
    <div className="page-shell max-w-2xl">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-drefit-lime mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <h1 className="fade-up font-bold mb-2">{workout.name}</h1>
      <div className="flex flex-wrap items-center gap-2 text-sm text-ink-muted mb-1">
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4" /> {workout.duration} mins
        </span>
        <span className="flex items-center gap-1">
          <Flame className="w-4 h-4" /> {workout.calories} cal
        </span>
        <span className={`px-2 py-0.5 rounded-full text-xs ${difficultyStyles[workout.difficulty] ?? "bg-white/10 text-white"}`}>
          {workout.difficulty}
        </span>
        <span className="px-2 py-0.5 rounded-full text-xs bg-white/10">{workout.muscleGroup}</span>
      </div>
      {completionCount > 0 && lastCompletedAt && (
        <p className="text-sm text-ink-muted mb-2">
          Completed {completionCount}× — last on {format(new Date(lastCompletedAt), "MMM d, yyyy")}
        </p>
      )}

      <div className="w-full h-1.5 bg-white/10 rounded-full mt-4 overflow-hidden">
        <motion.div
          className="h-full bg-drefit-lime"
          initial={false}
          animate={{ width: `${(completed.length / exercises.length) * 100}%` }}
          transition={{ ease: "easeOut" }}
        />
      </div>
      <p className="text-xs text-ink-muted mt-1 mb-4">
        {completed.length} of {exercises.length} exercises done
      </p>

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
              <p className="text-sm text-ink-muted">
                {ex.sets} sets x {ex.reps} reps • {ex.rest}s rest
              </p>
            </div>
            {completed.includes(ex.name) ? (
              <CheckCircle className="text-drefit-lime w-6 h-6" />
            ) : (
              <button onClick={() => markComplete(ex.name)} className="btn-primary px-4 py-1.5">
                Done
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
