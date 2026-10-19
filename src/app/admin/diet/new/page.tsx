import PageHeader from "@/components/ui/PageHeader"
import DietPlanForm from "../DietPlanForm"

export default function NewDietPlanPage() {
  return (
    <div className="page-shell max-w-2xl">
      <PageHeader back={{ href: "/admin/diet", label: "Diet plans" }} title="New diet plan" subtitle="One day of meals for a dietary preference." />
      <DietPlanForm />
    </div>
  )
}
