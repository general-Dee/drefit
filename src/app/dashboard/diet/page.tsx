"use client"
import { useEffect, useState } from "react"
import { Coffee, Sun, Moon, Apple, ShoppingCart } from "lucide-react"
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

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl">Diet Plans</h1>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : plans.length === 0 ? (
        <p className="text-gray-400">No diet plans available yet.</p>
      ) : (
        <>
          <div className="flex gap-2 flex-wrap">
            {plans.map((p) => (
              <button
                key={p.$id}
                onClick={() => setSelectedId(p.$id)}
                className={`px-4 py-2 rounded-lg ${selectedId === p.$id ? "bg-drefit-lime text-drefit-dark" : "bg-white/5"}`}
              >
                {p.day}
                {showPreferenceLabel ? ` (${p.dietaryPreference})` : ""}
              </button>
            ))}
          </div>

          {meals && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Coffee className="text-drefit-lime" />
                  Breakfast
                </div>
                <p>{meals.breakfast}</p>
              </div>
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sun className="text-drefit-lime" />
                  Lunch
                </div>
                <p>{meals.lunch}</p>
              </div>
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Moon className="text-drefit-lime" />
                  Dinner
                </div>
                <p>{meals.dinner}</p>
              </div>
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Apple className="text-drefit-lime" />
                  Snack
                </div>
                <p>{meals.snack}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleGenerateShoppingList}
            className="w-full glass-card p-4 flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" /> Generate Shopping List
          </button>
        </>
      )}
    </div>
  )
}
