"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Clock, Flame } from "lucide-react"
import toast from "react-hot-toast"
import type { WorkoutDoc } from "@/lib/appwrite/schema"

export const dynamic = "force-dynamic"

export default function AdminWorkoutsPage() {
  const [workouts, setWorkouts] = useState<WorkoutDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/admin/workouts")
      .then((res) => res.json())
      .then((data) => setWorkouts(data.workouts ?? []))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/workouts/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Could not delete workout")
        return
      }
      setWorkouts((prev) => prev.filter((w) => w.$id !== id))
      toast.success("Workout deleted")
    } finally {
      setDeletingId(null)
      setConfirmingDeleteId(null)
    }
  }

  return (
    <div className="page-shell max-w-4xl space-y-6">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink">
        <ArrowLeft className="w-4 h-4" /> Back to Admin
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="fade-up font-bold">Manage Workouts</h1>
        <Link href="/admin/workouts/new" className="btn-primary px-4 py-2.5">
          <Plus className="w-4 h-4" /> New Workout
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-16" />
          ))}
        </div>
      ) : workouts.length === 0 ? (
        <p className="text-ink-muted text-center py-12">No workouts yet.</p>
      ) : (
        <div className="space-y-3">
          {workouts.map((w) => (
            <div key={w.$id} className="glass-card p-4 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-bold">{w.name}</h3>
                <div className="flex gap-3 text-sm text-ink-muted mt-1">
                  <span>{w.muscleGroup}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {w.duration}m
                  </span>
                  <span className="flex items-center gap-1">
                    <Flame className="w-3 h-3" /> {w.calories}
                  </span>
                  <span>{w.difficulty}</span>
                  <span>{w.goal}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Link href={`/admin/workouts/${w.$id}/edit`} className="text-drefit-lime">
                  Edit
                </Link>
                {confirmingDeleteId === w.$id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-ink-muted">Sure?</span>
                    <button
                      onClick={() => handleDelete(w.$id)}
                      disabled={deletingId === w.$id}
                      className="btn-danger"
                    >
                      {deletingId === w.$id ? "Deleting..." : "Yes, delete"}
                    </button>
                    <button onClick={() => setConfirmingDeleteId(null)} className="text-ink-muted">
                      Never mind
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmingDeleteId(w.$id)} className="text-red-400">
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
