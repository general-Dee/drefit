import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import DietPlanForm from "../DietPlanForm"

export default function NewDietPlanPage() {
  return (
    <div className="page-shell max-w-2xl space-y-6">
      <Link href="/admin/diet" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink">
        <ArrowLeft className="w-4 h-4" /> Back to Diet Plans
      </Link>
      <h1 className="fade-up font-bold">New Diet Plan</h1>
      <DietPlanForm />
    </div>
  )
}
