"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Salad, Pencil, Trash2 } from "lucide-react"
import PageHeader from "@/components/ui/PageHeader"
import EmptyState from "@/components/ui/EmptyState"
import Spinner from "@/components/ui/Spinner"
import { ListRowsSkeleton } from "@/components/ui/skeletons"
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
    <div className="page-shell max-w-4xl">
      <PageHeader
        back={{ href: "/admin", label: "Admin" }}
        title="Diet plans"
        subtitle="One plan per day for each dietary preference."
        action={
          <Link href="/admin/diet/new" className="btn-primary">
            <Plus className="h-4 w-4" /> New plan
          </Link>
        }
      />

      {loading ? (
        <ListRowsSkeleton />
      ) : plans.length === 0 ? (
        <div className="glass-card">
          <EmptyState icon={Salad} title="No diet plans yet" description="Add a day of meals so members have something to cook." action={{ label: "Create plan", href: "/admin/diet/new" }} />
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([preference, preferencePlans]) => (
            <section key={preference}>
              <div className="mb-3 flex items-center gap-2">
                <h2 className="label-caps capitalize">{preference}</h2>
                <span className="chip tabular-nums">{preferencePlans.length}</span>
              </div>
              <ul className="stagger space-y-2.5">
                {preferencePlans.map((p) => (
                  <li key={p.$id} className="glass-card flex flex-wrap items-center justify-between gap-x-4 gap-y-3 p-4">
                    <div className="min-w-0 flex-1">
                      <h3>{p.day}</h3>
                      <p className="mt-1 truncate text-sm text-ink-muted">
                        {p.breakfast} · {p.lunch} · {p.dinner} · {p.snack}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {confirmingDeleteId === p.$id ? (
                        <div className="flex items-center gap-1 rounded-xl border border-red-400/20 bg-red-500/[0.06] p-1 pl-3">
                          <span className="text-sm text-ink-muted">Delete?</span>
                          <button onClick={() => setConfirmingDeleteId(null)} className="btn-ghost btn-sm">Cancel</button>
                          <button onClick={() => handleDelete(p.$id)} disabled={deletingId === p.$id} className="btn-danger btn-sm w-[96px]">
                            {deletingId === p.$id ? <Spinner /> : "Yes, delete"}
                          </button>
                        </div>
                      ) : (
                        <>
                          <Link href={`/admin/diet/${p.$id}/edit`} className="btn-ghost btn-sm" aria-label={`Edit ${p.day}`}>
                            <Pencil className="h-4 w-4" /> Edit
                          </Link>
                          <button onClick={() => setConfirmingDeleteId(p.$id)} className="icon-btn hover:!text-red-300" aria-label={`Delete ${p.day}`} title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
