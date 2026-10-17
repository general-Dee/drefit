"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import toast from "react-hot-toast"
import type { DietPlanDoc } from "@/lib/appwrite/schema"
import DietPlanForm from "../../DietPlanForm"

export default function EditDietPlanPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [plan, setPlan] = useState<DietPlanDoc | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/diet/${params.id}`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || "Could not load diet plan")
          router.push("/admin/diet")
          return
        }
        setPlan(data.plan)
      })
      .finally(() => setLoading(false))
  }, [params.id, router])

  return (
    <div className="page-shell max-w-2xl space-y-6">
      <Link href="/admin/diet" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink">
        <ArrowLeft className="w-4 h-4" /> Back to Diet Plans
      </Link>
      <h1 className="fade-up font-bold">Edit Diet Plan</h1>
      {loading ? (
        <div className="skeleton p-4 h-48" />
      ) : plan ? (
        <DietPlanForm initialPlan={plan} />
      ) : null}
    </div>
  )
}
