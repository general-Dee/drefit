"use client"
import { useEffect, useState } from "react"
import { Coffee, Sun, Moon, Apple, ShoppingCart, Salad } from "lucide-react"
import PageHeader from "@/components/ui/PageHeader"
import EmptyState from "@/components/ui/EmptyState"
import Skeleton from "@/components/ui/Skeleton"
import toast from "react-hot-toast"
import type { DietPlanDoc } from "@/lib/appwrite/schema"

export const dynamic = "force-dynamic"

export default function DietPage() {
  const [plans, setPlans] = useState<DietPlanDoc[]>([])
  const [selectedId, setSelectedId] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/diet")
      .then((res) => res.json())
      .then((data) => {
        const list: DietPlanDoc[] = data.plans ?? []
        setPlans(list)
        if (list.length > 0) setSelectedId(list[0].$id)
      })
      .finally(() => setLoading(false))
  }, [])

  const meals = plans.find((p) => p.$id === selectedId)
  // Days are only unique within a single dietary preference. The fallback
  // path (no preference set yet) can return multiple preferences at once,
  // so disambiguate day labels only when that's actually happening.
  const showPreferenceLabel = new Set(plans.map((p) => p.dietaryPreference)).size > 1

  const handleGenerateShoppingList = () => {
    if (!meals) return
    const items = [meals.breakfast, meals.lunch, meals.dinner, meals.snack].join(", ")
    toast.success(`Shopping list for ${meals.day}: ${items}`, { duration: 8000 })
  }

  const mealRows = meals
    ? [
        { key: "breakfast", label: "Breakfast", icon: Coffee, text: meals.breakfast },
        { key: "lunch", label: "Lunch", icon: Sun, text: meals.lunch },
        { key: "dinner", label: "Dinner", icon: Moon, text: meals.dinner },
        { key: "snack", label: "Snack", icon: Apple, text: meals.snack },
      ]
    : []

  return (
    <div className="page-shell">
      <PageHeader eyebrow="Nutrition" title="Diet plan" subtitle="Nigerian meals picked by your coach for each day." />

      {loading ? (
        <DietBodySkeleton />
      ) : plans.length === 0 ? (
        <div className="glass-card">
          <EmptyState icon={Salad} title="No meal plan yet" description="Your coach hasn't published meals for your diet yet. Ask them for one." action={{ label: "Message your coach", href: "/dashboard/coaching" }} />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" role="tablist" aria-label="Day">
            <div className="flex w-max gap-2">
              {plans.map((p) => {
                const active = selectedId === p.$id
                return (
                  <button
                    key={p.$id}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSelectedId(p.$id)}
                    className={`pressable min-h-[40px] whitespace-nowrap rounded-xl border px-4 text-sm font-medium transition-colors duration-base ${
                      active ? "border-transparent lime-gradient shadow-glow" : "border-line bg-white/[0.03] text-ink-muted hover:border-line-strong hover:text-ink"
                    }`}
                  >
                    {p.day}
                    {showPreferenceLabel ? ` (${p.dietaryPreference})` : ""}
                  </button>
                )
              })}
            </div>
          </div>

          {meals && (
            <div key={meals.$id} className="stagger grid gap-3 md:grid-cols-2 md:gap-4">
              {mealRows.map((m) => (
                <div key={m.key} className="glass-card flex gap-4 p-4 sm:p-5">
                  <span className="icon-tile"><m.icon className="h-[18px] w-[18px]" /></span>
                  <div className="min-w-0">
                    <div className="label-caps">{m.label}</div>
                    <p className="mt-1 break-words text-[15px] leading-6">{m.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button onClick={handleGenerateShoppingList} className="btn-primary w-full sm:w-auto">
            <ShoppingCart className="h-4 w-4" /> Generate shopping list
          </button>
        </div>
      )}
    </div>
  )
}

function DietBodySkeleton() {
  return (
    <div className="space-y-5" aria-busy="true">
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-10 w-[92px] shrink-0" />)}
      </div>
      <div className="grid gap-3 md:grid-cols-2 md:gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[92px]" />)}
      </div>
    </div>
  )
}
