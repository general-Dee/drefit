"use client"
import { useEffect, useState } from "react"
import { RefreshCw, Send } from "lucide-react"
import toast from "react-hot-toast"
import type { CoachingMessageDoc } from "@/lib/appwrite/schema"

export const dynamic = "force-dynamic"

export default function CoachingPage() {
  const [messages, setMessages] = useState<CoachingMessageDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [content, setContent] = useState("")
  const [sending, setSending] = useState(false)

  const loadMessages = () =>
    fetch("/api/coaching/messages")
      .then((res) => res.json())
      .then((data) => setMessages(data.messages ?? []))

  useEffect(() => {
    loadMessages().finally(() => setLoading(false))
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await loadMessages()
    } finally {
      setRefreshing(false)
    }
  }

  const handleSend = async () => {
    if (!content.trim()) return
    setSending(true)
    try {
      const res = await fetch("/api/coaching/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Could not send message")
        return
      }
      setMessages((prev) => [...prev, data.message])
      setContent("")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">Coaching</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-white disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="glass-card p-4 space-y-3 min-h-[300px]">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 rounded bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <p className="text-gray-400 text-center py-12">No messages yet — say hello to your coach.</p>
        ) : (
          messages.map((m) => (
            <div key={m.$id} className={`flex ${m.isFromAdmin ? "justify-start" : "justify-end"}`}>
              <div
                className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                  m.isFromAdmin ? "bg-white/5 text-gray-200" : "bg-drefit-lime text-drefit-dark"
                }`}
              >
                <div className="text-xs opacity-70 mb-1">{m.isFromAdmin ? "Coach" : "You"}</div>
                {m.content}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="glass-card p-4 flex gap-2">
        <input
          type="text"
          placeholder="Message your coach..."
          className="flex-1 bg-white/5 border border-white/10 rounded p-3"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          onClick={handleSend}
          disabled={sending || !content.trim()}
          className="flex items-center gap-1 bg-drefit-lime text-drefit-dark px-4 py-2 rounded disabled:opacity-50"
        >
          <Send className="w-4 h-4" /> {sending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  )
}
