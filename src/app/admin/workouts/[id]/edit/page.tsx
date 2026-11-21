"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import PageHeader from "@/components/ui/PageHeader"
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
    <div className="page-shell max-w-2xl">
      <PageHeader back={{ href: "/admin/workouts", label: "Workouts" }} title="Edit workout" subtitle="Changes go live for members on save." />
      {loading ? (
        <div className="skeleton w-full h-[560px]" />
      ) : workout ? (
        <WorkoutForm initialWorkout={workout} />
      ) : null}
    </div>
  )
}
