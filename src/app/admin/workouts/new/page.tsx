import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import WorkoutForm from "../WorkoutForm"

export default function NewWorkoutPage() {
  return (
    <div className="page-shell max-w-2xl space-y-6">
      <Link href="/admin/workouts" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink">
        <ArrowLeft className="w-4 h-4" /> Back to Workouts
      </Link>
      <h1 className="fade-up font-bold">New Workout</h1>
      <WorkoutForm />
    </div>
  )
}
