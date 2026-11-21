"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import confetti from "canvas-confetti"
import { ArrowLeft, Check, CloudOff, Clock, Flame, History } from "lucide-react"
import { WorkoutDetailSkeleton } from "@/components/ui/skeletons"
import { DUR, EASE_OUT } from "@/components/ui/motion"
import { format } from "date-fns"
import toast from "react-hot-toast"
import type { Exercise, WorkoutDoc } from "@/lib/appwrite/schema"
import { enqueueCompletion, isNetworkError, newClientId, postCompletion } from "@/lib/offline-queue"

export const dynamic = "force-dynamic"

const difficultyStyles: Record<string, string> = {
  beginner: "border-accent/30 bg-accent/10 text-accent",
  intermediate: "border-white/15 bg-white/[0.06] text-ink",
  advanced: "border-red-400/30 bg-red-500/10 text-red-300",
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
      toast.success("Workout complete!")
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
        toast("Saved offline — it will sync when you're back online.", { icon: <CloudOff className="h-4 w-4 text-accent" /> })
      }
    }
  }

  if (loading) return <WorkoutDetailSkeleton />
  if (!workout) return null

  const pct = exercises.length ? completed.length / exercises.length : 0

  return (
    <div className="page-shell max-w-2xl">
      <button onClick={() => router.back()} className="pressable -ml-1 mb-4 inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-sm font-medium text-ink-muted transition-colors duration-base hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <header className="fade-up">
        <div className="eyebrow mb-2">{workout.muscleGroup}</div>
        <h1 className="break-words">{workout.name}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
          <span className="chip tabular-nums"><Clock className="h-3.5 w-3.5" /> {workout.duration} min</span>
          <span className="chip tabular-nums"><Flame className="h-3.5 w-3.5" /> {workout.calories} kcal</span>
          <span className={`chip capitalize ${difficultyStyles[workout.difficulty] ?? ""}`}>{workout.difficulty}</span>
        </div>
        {completionCount > 0 && lastCompletedAt && (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-ink-muted">
            <History className="h-4 w-4" /> Completed {completionCount}× · last on {format(new Date(lastCompletedAt), "MMM d, yyyy")}
          </p>
        )}
      </header>

      <div className="glass-card mt-6 p-4">
        <div className="mb-2.5 flex items-baseline justify-between text-sm">
          <span className="font-medium">Session progress</span>
          <span className="tabular-nums text-ink-muted">{completed.length}/{exercises.length} exercises</span>
        </div>
        <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={exercises.length} aria-valuenow={completed.length}>
          <div className="progress-fill" style={{ transform: `scaleX(${pct})` }} />
        </div>
      </div>

      <ol className="mt-4 space-y-2.5">
        {exercises.map((ex, i) => {
          const done = completed.includes(ex.name)
          return (
            <motion.li
              key={ex.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: DUR.slow, ease: EASE_OUT }}
              className={`glass-card flex items-center gap-4 p-4 transition-colors duration-base ${done ? "!border-accent/30" : ""}`}
            >
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold tabular-nums ${done ? "lime-gradient" : "bg-white/[0.06] text-ink-muted"}`}>
                {done ? <Check className="icon-strong h-4 w-4" /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className={`truncate ${done ? "text-ink-muted line-through decoration-white/30" : ""}`}>{ex.name}</h3>
                <p className="text-sm tabular-nums text-ink-muted">
                  {ex.sets} × {ex.reps} reps · {ex.rest}s rest
                </p>
              </div>
              {done ? (
                <span className="chip-accent">Done</span>
              ) : (
                <button onClick={() => markComplete(ex.name)} className="btn-primary btn-sm">
                  Done
                </button>
              )}
            </motion.li>
          )
        })}
      </ol>
    </div>
  )
}
