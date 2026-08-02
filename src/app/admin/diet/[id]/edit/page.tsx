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
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <Link href="/admin/diet" className="flex items-center gap-2 text-drefit-lime">
        <ArrowLeft className="w-4 h-4" /> Back to Diet Plans
      </Link>
      <h1 className="text-3xl">Edit Diet Plan</h1>
      {loading ? (
        <div className="glass-card p-4 h-48 animate-pulse" />
      ) : plan ? (
        <DietPlanForm initialPlan={plan} />
      ) : null}
    </div>
  )
}
