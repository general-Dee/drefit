"use client"
import { useEffect } from "react"
import { flushQueue, postCompletion, QUEUE_EVENT } from "@/lib/offline-queue"

// Registers /sw.js in production builds and replays offline completions
// whenever the browser comes back online.
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => console.warn("SW registration failed", err))
    }
    const flush = async () => {
      if (!navigator.onLine) return
      const { synced } = await flushQueue(window.localStorage, postCompletion)
      if (synced > 0) window.dispatchEvent(new CustomEvent(QUEUE_EVENT, { detail: { synced } }))
    }
    flush()
    window.addEventListener("online", flush)
    return () => window.removeEventListener("online", flush)
  }, [])
  return null
}
