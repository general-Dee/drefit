import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import DietPlanForm from "../DietPlanForm"

export default function NewDietPlanPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <Link href="/admin/diet" className="flex items-center gap-2 text-drefit-lime">
        <ArrowLeft className="w-4 h-4" /> Back to Diet Plans
      </Link>
      <h1 className="text-3xl">New Diet Plan</h1>
      <DietPlanForm />
    </div>
  )
}
