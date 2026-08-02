"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, X } from "lucide-react"
import toast from "react-hot-toast"
import type { Exercise, WorkoutDoc } from "@/lib/appwrite/schema"

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
    <div className="space-y-6">
      <div className="glass-card p-4 space-y-3">
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded p-2"
        />
        <input
          placeholder="Muscle group"
          value={muscleGroup}
          onChange={(e) => setMuscleGroup(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded p-2"
        />
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm text-gray-400">
            Duration (mins)
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded p-2 mt-1"
            />
          </label>
          <label className="text-sm text-gray-400">
            Calories
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded p-2 mt-1"
            />
          </label>
          <label className="text-sm text-gray-400">
            Difficulty
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
              className="w-full bg-white/5 border border-white/10 rounded p-2 mt-1"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>
          <label className="text-sm text-gray-400">
            Goal
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value as typeof goal)}
              className="w-full bg-white/5 border border-white/10 rounded p-2 mt-1"
            >
              <option value="weight-loss">Weight loss</option>
              <option value="muscle-gain">Muscle gain</option>
              <option value="endurance">Endurance</option>
            </select>
          </label>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl">Exercises</h2>
          <span className={`text-xs ${exercisesJsonLength > 5000 ? "text-red-400" : "text-gray-400"}`}>
            {exercisesJsonLength} / 5000
          </span>
        </div>
        {exercises.map((ex, i) => (
          <div key={i} className="glass-card p-3 grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center">
            <input
              placeholder="Exercise name"
              value={ex.name}
              onChange={(e) => updateExercise(i, { name: e.target.value })}
              className="bg-white/5 border border-white/10 rounded p-2"
            />
            <input
              type="number"
              placeholder="Sets"
              value={ex.sets}
              onChange={(e) => updateExercise(i, { sets: Number(e.target.value) })}
              className="w-16 bg-white/5 border border-white/10 rounded p-2"
            />
            <input
              type="number"
              placeholder="Reps"
              value={ex.reps}
              onChange={(e) => updateExercise(i, { reps: Number(e.target.value) })}
              className="w-16 bg-white/5 border border-white/10 rounded p-2"
            />
            <input
              type="number"
              placeholder="Rest (s)"
              value={ex.rest}
              onChange={(e) => updateExercise(i, { rest: Number(e.target.value) })}
              className="w-16 bg-white/5 border border-white/10 rounded p-2"
            />
            <button
              onClick={() => removeExercise(i)}
              disabled={exercises.length === 1}
              className="text-red-400 disabled:opacity-30"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button onClick={addExercise} className="flex items-center gap-1 text-drefit-lime">
          <Plus className="w-4 h-4" /> Add Exercise
        </button>
      </div>

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="bg-drefit-lime text-drefit-dark px-4 py-2 rounded disabled:opacity-50"
      >
        {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Workout"}
      </button>
    </div>
  )
}
