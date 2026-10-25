"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { Apple, Check, Coffee, Moon, Sun } from "lucide-react"
import Spinner from "@/components/ui/Spinner"
import type { DietPlanDoc } from "@/lib/db/schema"

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
    <div className="space-y-4 pb-20 lg:pb-0">
      <section className="glass-card p-4 sm:p-5">
        <h2 className="label-caps mb-4">Plan</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="field-label">Dietary preference</span>
            <select value={dietaryPreference} onChange={(e) => setDietaryPreference(e.target.value as typeof dietaryPreference)} className="input-field">
              <option value="omnivore">Omnivore</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="keto">Keto</option>
              <option value="halal">Halal</option>
            </select>
          </label>
          <label className="block">
            <span className="field-label">Day</span>
            <input placeholder="e.g. Monday" value={day} onChange={(e) => setDay(e.target.value)} className="input-field" />
          </label>
        </div>
      </section>
      <section className="glass-card p-4 sm:p-5">
        <h2 className="label-caps mb-4">Meals</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="field-label flex items-center gap-1.5"><Coffee className="h-3.5 w-3.5 text-accent" /> Breakfast</span>
            <textarea value={breakfast} onChange={(e) => setBreakfast(e.target.value)} className="input-field resize-none" rows={2} />
          </label>
          <label className="block">
            <span className="field-label flex items-center gap-1.5"><Sun className="h-3.5 w-3.5 text-accent" /> Lunch</span>
            <textarea value={lunch} onChange={(e) => setLunch(e.target.value)} className="input-field resize-none" rows={2} />
          </label>
          <label className="block">
            <span className="field-label flex items-center gap-1.5"><Moon className="h-3.5 w-3.5 text-accent" /> Dinner</span>
            <textarea value={dinner} onChange={(e) => setDinner(e.target.value)} className="input-field resize-none" rows={2} />
          </label>
          <label className="block">
            <span className="field-label flex items-center gap-1.5"><Apple className="h-3.5 w-3.5 text-accent" /> Snack</span>
            <textarea value={snack} onChange={(e) => setSnack(e.target.value)} className="input-field resize-none" rows={2} />
          </label>
        </div>
      </section>
      <div className="bar fixed inset-x-0 bottom-[calc(62px+env(safe-area-inset-bottom))] z-20 border-t p-3 lg:static lg:border-0 lg:bg-transparent lg:p-0">
        <div className="mx-auto flex max-w-2xl justify-end">
          <button onClick={handleSubmit} disabled={saving} className="btn-primary w-full sm:w-[180px]">
            {saving ? <Spinner /> : <Check className="h-4 w-4" />} {saving ? "Saving" : isEditing ? "Save changes" : "Create diet plan"}
          </button>
        </div>
      </div>
    </div>
  )
}
