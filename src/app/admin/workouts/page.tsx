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
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <Link href="/admin" className="flex items-center gap-2 text-drefit-lime">
        <ArrowLeft className="w-4 h-4" /> Back to Admin
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">Manage Workouts</h1>
        <Link href="/admin/workouts/new" className="flex items-center gap-1 bg-drefit-lime text-drefit-dark px-4 py-2 rounded">
          <Plus className="w-4 h-4" /> New Workout
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="glass-card p-4 h-16 animate-pulse" />
          ))}
        </div>
      ) : workouts.length === 0 ? (
        <p className="text-gray-400 text-center py-12">No workouts yet.</p>
      ) : (
        <div className="space-y-3">
          {workouts.map((w) => (
            <div key={w.$id} className="glass-card p-4 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-bold">{w.name}</h3>
                <div className="flex gap-3 text-sm text-gray-400 mt-1">
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
                    <span className="text-sm text-gray-400">Sure?</span>
                    <button
                      onClick={() => handleDelete(w.$id)}
                      disabled={deletingId === w.$id}
                      className="text-red-400 font-medium disabled:opacity-50"
                    >
                      {deletingId === w.$id ? "Deleting..." : "Yes, delete"}
                    </button>
                    <button onClick={() => setConfirmingDeleteId(null)} className="text-gray-400">
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
