"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"

interface Thread {
  userId: string
  userName: string
  lastMessage: string
  lastMessageAt: string
  lastFromAdmin: boolean
}

export default function AdminCoachingInboxPage() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/coaching/threads")
      .then((res) => res.json())
      .then((data) => setThreads(data.threads ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <Link href="/admin" className="flex items-center gap-2 text-drefit-lime">
        <ArrowLeft className="w-4 h-4" /> Back to Admin
      </Link>
      <h1 className="text-3xl">Coaching Messages</h1>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="glass-card p-4 h-16 animate-pulse" />
          ))}
        </div>
      ) : threads.length === 0 ? (
        <p className="text-gray-400 text-center py-12">No conversations yet.</p>
      ) : (
        <div className="space-y-3">
          {threads.map((t) => (
            <Link
              key={t.userId}
              href={`/admin/coaching/${t.userId}`}
              className="glass-card p-4 flex items-center justify-between gap-4 hover:border-drefit-lime/40 transition-colors"
            >
              <div>
                <h3 className="font-bold">{t.userName}</h3>
                <p className="text-sm text-gray-400 mt-1 line-clamp-1">
                  {t.lastFromAdmin ? "You: " : ""}{t.lastMessage}
                </p>
              </div>
              <span className="text-xs text-gray-500 shrink-0">
                {new Date(t.lastMessageAt).toLocaleString()}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
