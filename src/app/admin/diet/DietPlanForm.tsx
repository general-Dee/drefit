"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import type { DietPlanDoc } from "@/lib/appwrite/schema"

export default function DietPlanForm({ initialPlan }: { initialPlan?: DietPlanDoc }) {
  const router = useRouter()
  const isEditing = !!initialPlan

  const [dietaryPreference, setDietaryPreference] = useState(initialPlan?.dietaryPreference ?? "omnivore")
  const [day, setDay] = useState(initialPlan?.day ?? "")
  const [breakfast, setBreakfast] = useState(initialPlan?.breakfast ?? "")
  const [lunch, setLunch] = useState(initialPlan?.lunch ?? "")
  const [dinner, setDinner] = useState(initialPlan?.dinner ?? "")
  const [snack, setSnack] = useState(initialPlan?.snack ?? "")
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const res = await fetch(isEditing ? `/api/admin/diet/${initialPlan.$id}` : "/api/admin/diet", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dietaryPreference, day, breakfast, lunch, dinner, snack }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Could not save diet plan")
        return
      }
      toast.success(isEditing ? "Diet plan updated" : "Diet plan created")
      router.push("/admin/diet")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm text-ink-muted">
          Dietary preference
          <select
            value={dietaryPreference}
            onChange={(e) => setDietaryPreference(e.target.value as typeof dietaryPreference)}
            className="input-field mt-1"
          >
            <option value="omnivore">Omnivore</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="keto">Keto</option>
            <option value="halal">Halal</option>
          </select>
        </label>
        <label className="text-sm text-ink-muted">
          Day
          <input
            placeholder="e.g. Monday"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="input-field mt-1"
          />
        </label>
      </div>
      <label className="block text-sm text-ink-muted">
        Breakfast
        <textarea
          value={breakfast}
          onChange={(e) => setBreakfast(e.target.value)}
          className="input-field mt-1"
          rows={2}
        />
      </label>
      <label className="block text-sm text-ink-muted">
        Lunch
        <textarea
          value={lunch}
          onChange={(e) => setLunch(e.target.value)}
          className="input-field mt-1"
          rows={2}
        />
      </label>
      <label className="block text-sm text-ink-muted">
        Dinner
        <textarea
          value={dinner}
          onChange={(e) => setDinner(e.target.value)}
          className="input-field mt-1"
          rows={2}
        />
      </label>
      <label className="block text-sm text-ink-muted">
        Snack
        <textarea
          value={snack}
          onChange={(e) => setSnack(e.target.value)}
          className="input-field mt-1"
          rows={2}
        />
      </label>
      <button
        onClick={handleSubmit}
        disabled={saving}
        className="btn-primary"
      >
        {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Diet Plan"}
      </button>
    </div>
  )
}
