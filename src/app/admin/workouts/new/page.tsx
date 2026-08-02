import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import WorkoutForm from "../WorkoutForm"

export default function NewWorkoutPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <Link href="/admin/workouts" className="flex items-center gap-2 text-drefit-lime">
        <ArrowLeft className="w-4 h-4" /> Back to Workouts
      </Link>
      <h1 className="text-3xl">New Workout</h1>
      <WorkoutForm />
    </div>
  )
}
