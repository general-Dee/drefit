"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import toast from "react-hot-toast"
import type { WorkoutDoc } from "@/lib/appwrite/schema"
import WorkoutForm from "../../WorkoutForm"

export default function EditWorkoutPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [workout, setWorkout] = useState<WorkoutDoc | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/workouts/${params.id}`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || "Could not load workout")
          router.push("/admin/workouts")
          return
        }
        setWorkout(data.workout)
      })
      .finally(() => setLoading(false))
  }, [params.id, router])

  return (
    <div className="page-shell max-w-2xl space-y-6">
      <Link href="/admin/workouts" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink">
        <ArrowLeft className="w-4 h-4" /> Back to Workouts
      </Link>
      <h1 className="fade-up font-bold">Edit Workout</h1>
      {loading ? (
        <div className="skeleton p-4 h-48" />
      ) : workout ? (
        <WorkoutForm initialWorkout={workout} />
      ) : null}
    </div>
  )
}
