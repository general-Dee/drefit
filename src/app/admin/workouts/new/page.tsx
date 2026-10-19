import PageHeader from "@/components/ui/PageHeader"
import WorkoutForm from "../WorkoutForm"

export default function NewWorkoutPage() {
  return (
    <div className="page-shell max-w-2xl">
      <PageHeader back={{ href: "/admin/workouts", label: "Workouts" }} title="New workout" subtitle="Members see it in Train as soon as you save." />
      <WorkoutForm />
    </div>
  )
}
