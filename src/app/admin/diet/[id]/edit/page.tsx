"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import PageHeader from "@/components/ui/PageHeader"
import toast from "react-hot-toast"
import type { DietPlanDoc } from "@/lib/db/schema"
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
    <div className="page-shell max-w-2xl">
      <PageHeader back={{ href: "/admin/diet", label: "Diet plans" }} title="Edit diet plan" subtitle="Changes go live for members on save." />
      {loading ? (
        <div className="skeleton w-full h-[520px]" />
      ) : plan ? (
        <DietPlanForm initialPlan={plan} />
      ) : null}
    </div>
  )
}
