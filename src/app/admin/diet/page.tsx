"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Plus } from "lucide-react"
import toast from "react-hot-toast"
import type { DietPlanDoc } from "@/lib/appwrite/schema"

export const dynamic = "force-dynamic"

export default function AdminDietPage() {
  const [plans, setPlans] = useState<DietPlanDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/admin/diet")
      .then((res) => res.json())
      .then((data) => setPlans(data.plans ?? []))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/diet/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Could not delete diet plan")
        return
      }
      setPlans((prev) => prev.filter((p) => p.$id !== id))
      toast.success("Diet plan deleted")
    } finally {
      setDeletingId(null)
      setConfirmingDeleteId(null)
    }
  }

  const grouped = plans.reduce<Record<string, DietPlanDoc[]>>((acc, p) => {
    acc[p.dietaryPreference] = acc[p.dietaryPreference] ?? []
    acc[p.dietaryPreference].push(p)
    return acc
  }, {})

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <Link href="/admin" className="flex items-center gap-2 text-drefit-lime">
        <ArrowLeft className="w-4 h-4" /> Back to Admin
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">Manage Diet Plans</h1>
        <Link href="/admin/diet/new" className="flex items-center gap-1 bg-drefit-lime text-drefit-dark px-4 py-2 rounded">
          <Plus className="w-4 h-4" /> New Plan
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="glass-card p-4 h-16 animate-pulse" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <p className="text-gray-400 text-center py-12">No diet plans yet.</p>
      ) : (
        Object.entries(grouped).map(([preference, preferencePlans]) => (
          <div key={preference} className="space-y-3">
            <h2 className="text-xl capitalize">{preference}</h2>
            {preferencePlans.map((p) => (
              <div key={p.$id} className="glass-card p-4 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold">{p.day}</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {p.breakfast} • {p.lunch} • {p.dinner} • {p.snack}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Link href={`/admin/diet/${p.$id}/edit`} className="text-drefit-lime">
                    Edit
                  </Link>
                  {confirmingDeleteId === p.$id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">Sure?</span>
                      <button
                        onClick={() => handleDelete(p.$id)}
                        disabled={deletingId === p.$id}
                        className="text-red-400 font-medium disabled:opacity-50"
                      >
                        {deletingId === p.$id ? "Deleting..." : "Yes, delete"}
                      </button>
                      <button onClick={() => setConfirmingDeleteId(null)} className="text-gray-400">
                        Never mind
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmingDeleteId(p.$id)} className="text-red-400">
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  )
}
