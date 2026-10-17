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
    <div className="page-shell max-w-4xl space-y-6">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink">
        <ArrowLeft className="w-4 h-4" /> Back to Admin
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="fade-up font-bold">Manage Diet Plans</h1>
        <Link href="/admin/diet/new" className="btn-primary px-4 py-2.5">
          <Plus className="w-4 h-4" /> New Plan
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-16" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <p className="text-ink-muted text-center py-12">No diet plans yet.</p>
      ) : (
        Object.entries(grouped).map(([preference, preferencePlans]) => (
          <div key={preference} className="space-y-3">
            <h2 className="text-xl capitalize">{preference}</h2>
            {preferencePlans.map((p) => (
              <div key={p.$id} className="glass-card p-4 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold">{p.day}</h3>
                  <p className="text-sm text-ink-muted mt-1">
                    {p.breakfast} • {p.lunch} • {p.dinner} • {p.snack}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Link href={`/admin/diet/${p.$id}/edit`} className="text-drefit-lime">
                    Edit
                  </Link>
                  {confirmingDeleteId === p.$id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-ink-muted">Sure?</span>
                      <button
                        onClick={() => handleDelete(p.$id)}
                        disabled={deletingId === p.$id}
                        className="btn-danger"
                      >
                        {deletingId === p.$id ? "Deleting..." : "Yes, delete"}
                      </button>
                      <button onClick={() => setConfirmingDeleteId(null)} className="text-ink-muted">
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
