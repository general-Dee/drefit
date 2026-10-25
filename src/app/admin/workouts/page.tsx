"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Clock, Flame, Dumbbell, Pencil, Trash2 } from "lucide-react"
import PageHeader from "@/components/ui/PageHeader"
import EmptyState from "@/components/ui/EmptyState"
import Spinner from "@/components/ui/Spinner"
import { ListRowsSkeleton } from "@/components/ui/skeletons"
import toast from "react-hot-toast"
import type { WorkoutDoc } from "@/lib/db/schema"

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
    <div className="page-shell max-w-4xl">
      <PageHeader
        back={{ href: "/admin", label: "Admin" }}
        title="Workouts"
        subtitle="Your coach-built library. Members see these in Train."
        action={
          <Link href="/admin/workouts/new" className="btn-primary">
            <Plus className="h-4 w-4" /> New workout
          </Link>
        }
      />

      {loading ? (
        <ListRowsSkeleton />
      ) : workouts.length === 0 ? (
        <div className="glass-card">
          <EmptyState icon={Dumbbell} title="Your library is empty" description="Create the first workout. Members see it straight away." action={{ label: "Create workout", href: "/admin/workouts/new" }} />
        </div>
      ) : (
        <ul className="stagger space-y-2.5">
          {workouts.map((w) => (
            <li key={w.$id} className="glass-card flex flex-wrap items-center justify-between gap-x-4 gap-y-3 p-4">
              <div className="min-w-0 flex-1">
                <h3 className="truncate">{w.name}</h3>
                <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs">
                  <span className="chip">{w.muscleGroup}</span>
                  <span className="chip tabular-nums"><Clock className="h-3 w-3" /> {w.duration} min</span>
                  <span className="chip tabular-nums"><Flame className="h-3 w-3" /> {w.calories} kcal</span>
                  <span className="chip capitalize">{w.difficulty}</span>
                  <span className="chip capitalize">{w.goal}</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {confirmingDeleteId === w.$id ? (
                  <div className="flex items-center gap-1 rounded-xl border border-red-400/20 bg-red-500/[0.06] p-1 pl-3">
                    <span className="text-sm text-ink-muted">Delete?</span>
                    <button onClick={() => setConfirmingDeleteId(null)} className="btn-ghost btn-sm">Cancel</button>
                    <button onClick={() => handleDelete(w.$id)} disabled={deletingId === w.$id} className="btn-danger btn-sm w-[96px]">
                      {deletingId === w.$id ? <Spinner /> : "Yes, delete"}
                    </button>
                  </div>
                ) : (
                  <>
                    <Link href={`/admin/workouts/${w.$id}/edit`} className="btn-ghost btn-sm" aria-label={`Edit ${w.name}`}>
                      <Pencil className="h-4 w-4" /> Edit
                    </Link>
                    <button onClick={() => setConfirmingDeleteId(w.$id)} className="icon-btn hover:!text-red-300" aria-label={`Delete ${w.name}`} title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
