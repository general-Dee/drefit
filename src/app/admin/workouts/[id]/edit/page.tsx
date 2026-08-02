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
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <Link href="/admin/workouts" className="flex items-center gap-2 text-drefit-lime">
        <ArrowLeft className="w-4 h-4" /> Back to Workouts
      </Link>
      <h1 className="text-3xl">Edit Workout</h1>
      {loading ? (
        <div className="glass-card p-4 h-48 animate-pulse" />
      ) : workout ? (
        <WorkoutForm initialWorkout={workout} />
      ) : null}
    </div>
  )
}
