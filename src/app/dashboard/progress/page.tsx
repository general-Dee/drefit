"use client"
import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import { Camera, Scale } from "lucide-react"
import { format } from "date-fns"
import toast from "react-hot-toast"
import type { ProgressLogDoc, ProgressPhotoDoc } from "@/lib/appwrite/schema"

export const dynamic = "force-dynamic"

export default function ProgressPage() {
  const [logs, setLogs] = useState<ProgressLogDoc[]>([])
  const [photos, setPhotos] = useState<ProgressPhotoDoc[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [showWeightForm, setShowWeightForm] = useState(false)
  const [weightInput, setWeightInput] = useState("")
  const [savingWeight, setSavingWeight] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadData = async () => {
    const [logsRes, photosRes] = await Promise.all([
      fetch("/api/progress/weight"),
      fetch("/api/progress/photos"),
    ])
    const logsData = await logsRes.json()
    const photosData = await photosRes.json()
    setLogs((logsData.logs ?? []).slice().reverse())
    setPhotos(photosData.photos ?? [])
  }

  useEffect(() => {
    loadData().finally(() => setLoadingData(false))
  }, [])

  const handleLogWeight = async (e: React.FormEvent) => {
    e.preventDefault()
    const weight = parseFloat(weightInput)
    if (!weight || weight <= 0) {
      toast.error("Enter a valid weight")
      return
    }
    setSavingWeight(true)
    try {
      const res = await fetch("/api/progress/weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weight }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Could not save weight entry")
        return
      }
      toast.success("Weight logged")
      setWeightInput("")
      setShowWeightForm(false)
      await loadData()
    } finally {
      setSavingWeight(false)
    }
  }

  const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    setUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/progress/photos", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Could not upload photo")
        return
      }
      toast.success("Photo uploaded")
      await loadData()
    } finally {
      setUploadingPhoto(false)
    }
  }

  const chartData = logs.map((log) => ({
    week: format(new Date(log.loggedAt), "MMM d"),
    weight: log.weight,
  }))

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl">Progress Tracker</h1>

      <div className="glass-card p-4 h-80 flex items-center justify-center">
        {loadingData ? (
          <p className="text-gray-400">Loading...</p>
        ) : chartData.length === 0 ? (
          <p className="text-gray-400">No weight logged yet — add your first entry below.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <XAxis dataKey="week" stroke="#666" />
              <YAxis stroke="#666" domain={["auto", "auto"]} />
              <Tooltip />
              <Area type="monotone" dataKey="weight" stroke="#C8F135" fill="#C8F135" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <button
          onClick={() => setShowWeightForm((v) => !v)}
          className="glass-card p-4 flex items-center gap-3"
        >
          <Scale className="text-drefit-lime" /> Log Weight
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingPhoto}
          className="glass-card p-4 flex items-center gap-3 disabled:opacity-50"
        >
          <Camera className="text-drefit-lime" /> {uploadingPhoto ? "Uploading..." : "Upload Photo"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoSelected}
        />
      </div>

      {showWeightForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          onSubmit={handleLogWeight}
          className="glass-card p-4 flex items-center gap-3"
        >
          <input
            type="number"
            step="0.1"
            placeholder="Weight (kg)"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded p-2"
            required
          />
          <button
            type="submit"
            disabled={savingWeight}
            className="bg-drefit-lime text-drefit-dark px-4 py-2 rounded disabled:opacity-50"
          >
            {savingWeight ? "Saving..." : "Save"}
          </button>
        </motion.form>
      )}

      {photos.length > 0 && (
        <div className="glass-card p-4">
          <h2 className="text-lg mb-3">Progress Photos</h2>
          <div className="flex gap-3 overflow-x-auto">
            {photos.map((photo) => (
              <div key={photo.$id} className="shrink-0 text-center">
                <img
                  src={`/api/progress/photos/${photo.fileId}`}
                  alt="Progress"
                  className="w-24 h-24 object-cover rounded"
                />
                <p className="text-xs text-gray-400 mt-1">{format(new Date(photo.takenAt), "MMM d")}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
