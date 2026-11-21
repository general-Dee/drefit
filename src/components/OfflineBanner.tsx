"use client"
import { useEffect, useState } from "react"
import { WifiOff, RefreshCw } from "lucide-react"
import toast from "react-hot-toast"
import { QUEUE_EVENT, readQueue } from "@/lib/offline-queue"

export default function OfflineBanner() {
  const [online, setOnline] = useState(true)
  const [pending, setPending] = useState(0)

  useEffect(() => {
    const refresh = () => {
      setOnline(navigator.onLine)
      setPending(readQueue(window.localStorage).length)
    }
    const onSynced = (e: Event) => {
      refresh()
      const synced = (e as CustomEvent<{ synced?: number }>).detail?.synced
      if (synced) toast.success(`Synced ${synced} offline workout${synced === 1 ? "" : "s"}`)
    }
    refresh()
    window.addEventListener("online", refresh)
    window.addEventListener("offline", refresh)
    window.addEventListener(QUEUE_EVENT, onSynced)
    window.addEventListener("storage", refresh)
    return () => {
      window.removeEventListener("online", refresh)
      window.removeEventListener("offline", refresh)
      window.removeEventListener(QUEUE_EVENT, onSynced)
      window.removeEventListener("storage", refresh)
    }
  }, [])

  if (online && pending === 0) return null
  return (
    <div role="status" className="sticky top-0 z-40 flex items-center justify-center gap-2 border-b border-accent/20 bg-surface-3 px-4 py-2 text-[13px] font-medium text-ink">
      {online ? <RefreshCw className="h-4 w-4 animate-spin text-accent" /> : <WifiOff className="h-4 w-4 text-accent" />}
      {online
        ? `Syncing ${pending} workout${pending === 1 ? "" : "s"} completed offline…`
        : `You're offline — showing saved workouts.${pending ? ` ${pending} completion${pending === 1 ? "" : "s"} will sync later.` : ""}`}
    </div>
  )
}
