"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Plus, X } from "lucide-react"
import Spinner from "@/components/ui/Spinner"
import toast from "react-hot-toast"
import type { Exercise, WorkoutDoc } from "@/lib/db/schema"

const EMPTY_EXERCISE: Exercise = { name: "", sets: 3, reps: 10, rest: 30 }

export default function WorkoutForm({ initialWorkout }: { initialWorkout?: WorkoutDoc }) {
  const router = useRouter()
  const isEditing = !!initialWorkout

  const [name, setName] = useState(initialWorkout?.name ?? "")
  const [muscleGroup, setMuscleGroup] = useState(initialWorkout?.muscleGroup ?? "")
  const [duration, setDuration] = useState(initialWorkout?.duration ?? 30)
  const [difficulty, setDifficulty] = useState(initialWorkout?.difficulty ?? "beginner")
  const [calories, setCalories] = useState(initialWorkout?.calories ?? 200)
  const [goal, setGoal] = useState(initialWorkout?.goal ?? "weight-loss")
  const [exercises, setExercises] = useState<Exercise[]>(
    initialWorkout ? JSON.parse(initialWorkout.exercisesJson) : [{ ...EMPTY_EXERCISE }]
  )
  const [saving, setSaving] = useState(false)

  const updateExercise = (i: number, patch: Partial<Exercise>) =>
    setExercises((prev) => prev.map((ex, idx) => (idx === i ? { ...ex, ...patch } : ex)))
  const addExercise = () => setExercises((prev) => [...prev, { ...EMPTY_EXERCISE }])
  const removeExercise = (i: number) => setExercises((prev) => prev.filter((_, idx) => idx !== i))

  const exercisesJsonLength = JSON.stringify(exercises).length

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const res = await fetch(isEditing ? `/api/admin/workouts/${initialWorkout.$id}` : "/api/admin/workouts", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, muscleGroup, duration, difficulty, calories, goal, exercises }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Could not save workout")
        return
      }
      toast.success(isEditing ? "Workout updated" : "Workout created")
      router.push("/admin/workouts")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <section className="glass-card p-4 sm:p-5">
        <h2 className="label-caps mb-4">Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="field-label">Name</span>
            <input placeholder="e.g. Lower Body + Core" value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
          </label>
          <label className="block sm:col-span-2">
            <span className="field-label">Muscle group</span>
            <input placeholder="e.g. Legs" value={muscleGroup} onChange={(e) => setMuscleGroup(e.target.value)} className="input-field" />
          </label>
          <label className="block">
            <span className="field-label">Duration (mins)</span>
            <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="input-field tabular-nums" />
          </label>
          <label className="block">
            <span className="field-label">Calories</span>
            <input type="number" value={calories} onChange={(e) => setCalories(Number(e.target.value))} className="input-field tabular-nums" />
          </label>
          <label className="block">
            <span className="field-label">Difficulty</span>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as typeof difficulty)} className="input-field">
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>
          <label className="block">
            <span className="field-label">Goal</span>
            <select value={goal} onChange={(e) => setGoal(e.target.value as typeof goal)} className="input-field">
              <option value="weight-loss">Weight loss</option>
              <option value="muscle-gain">Muscle gain</option>
              <option value="endurance">Endurance</option>
            </select>
          </label>
        </div>
      </section>

      <section className="glass-card p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="label-caps">Exercises <span className="ml-1 text-ink-muted tabular-nums">{exercises.length}</span></h2>
          <span className={`text-xs tabular-nums ${exercisesJsonLength > 5000 ? "text-red-300" : "text-ink-subtle"}`}>
            {exercisesJsonLength} / 5000
          </span>
        </div>
        <div className="mb-2 hidden grid-cols-[1.75rem_1fr_4.5rem_4.5rem_4.5rem_2.5rem] gap-2 px-1 sm:grid">
          <span />
          <span className="label-caps text-[10px]">Name</span>
          <span className="label-caps text-center text-[10px]">Sets</span>
          <span className="label-caps text-center text-[10px]">Reps</span>
          <span className="label-caps text-center text-[10px]">Rest s</span>
          <span />
        </div>
        <ol className="space-y-2">
          {exercises.map((ex, i) => (
            <li key={i} className="grid grid-cols-[1.75rem_1fr_2.5rem] items-center gap-2 rounded-xl border border-line bg-white/[0.02] p-2 sm:grid-cols-[1.75rem_1fr_4.5rem_4.5rem_4.5rem_2.5rem]">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-white/[0.06] text-xs font-semibold tabular-nums text-ink-muted">{i + 1}</span>
              <input placeholder="Exercise name" aria-label={`Exercise ${i + 1} name`} value={ex.name} onChange={(e) => updateExercise(i, { name: e.target.value })} className="input-field" />
              <button
                onClick={() => removeExercise(i)}
                disabled={exercises.length === 1}
                className="icon-btn hover:!text-red-300 disabled:opacity-30 sm:order-last"
                aria-label={`Remove exercise ${i + 1}`}
              >
                <X className="h-4 w-4" />
              </button>
              <div className="col-span-3 grid grid-cols-3 gap-2 sm:col-span-3 sm:contents">
                <input type="number" placeholder="Sets" aria-label="Sets" value={ex.sets} onChange={(e) => updateExercise(i, { sets: Number(e.target.value) })} className="input-field px-2 text-center tabular-nums" />
                <input type="number" placeholder="Reps" aria-label="Reps" value={ex.reps} onChange={(e) => updateExercise(i, { reps: Number(e.target.value) })} className="input-field px-2 text-center tabular-nums" />
                <input type="number" placeholder="Rest (s)" aria-label="Rest seconds" value={ex.rest} onChange={(e) => updateExercise(i, { rest: Number(e.target.value) })} className="input-field px-2 text-center tabular-nums" />
              </div>
            </li>
          ))}
        </ol>
        <button onClick={addExercise} className="btn-secondary btn-sm mt-3">
          <Plus className="h-4 w-4" /> Add exercise
        </button>
      </section>

      <div className="bar fixed inset-x-0 bottom-[calc(62px+env(safe-area-inset-bottom))] z-20 border-t p-3 lg:static lg:border-0 lg:bg-transparent lg:p-0">
        <div className="mx-auto flex max-w-2xl justify-end">
          <button onClick={handleSubmit} disabled={saving} className="btn-primary w-full sm:w-[180px]">
            {saving ? <Spinner /> : <Check className="h-4 w-4" />} {saving ? "Saving" : isEditing ? "Save changes" : "Create workout"}
          </button>
        </div>
      </div>
    </div>
  )
}
