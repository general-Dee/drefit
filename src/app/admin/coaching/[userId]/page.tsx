"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Send } from "lucide-react"
import toast from "react-hot-toast"
import type { CoachingMessageDoc } from "@/lib/appwrite/schema"

export const dynamic = "force-dynamic"

export default function AdminCoachingThreadPage({ params }: { params: { userId: string } }) {
  const userId = params.userId

  const [messages, setMessages] = useState<CoachingMessageDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState("")
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/coaching/messages/${userId}`)
      .then((res) => res.json())
      .then((data) => setMessages(data.messages ?? []))
      .finally(() => setLoading(false))
  }, [userId])

  const memberName = messages.find((m) => !m.isFromAdmin)?.senderName ?? "Member"

  const handleSend = async () => {
    if (!content.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/admin/coaching/messages/${userId}`, {
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
    <div className="page-shell max-w-3xl space-y-6">
      <Link href="/admin/coaching" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink">
        <ArrowLeft className="w-4 h-4" /> Back to Inbox
      </Link>
      <h1 className="fade-up font-bold">{memberName}</h1>

      <div className="glass-card p-4 space-y-3 min-h-[300px]">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-12" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <p className="text-ink-muted text-center py-12">No messages yet.</p>
        ) : (
          messages.map((m) => (
            <div key={m.$id} className={`flex ${m.isFromAdmin ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                  m.isFromAdmin ? "bg-accent text-accent-ink rounded-br-md" : "bg-white/[0.06] text-ink rounded-bl-md"
                }`}
              >
                <div className="text-xs opacity-70 mb-1">{m.isFromAdmin ? "You" : m.senderName}</div>
                {m.content}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="glass-card p-4 flex gap-2">
        <input
          type="text"
          placeholder="Reply..."
          className="input-field flex-1"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          onClick={handleSend}
          disabled={sending || !content.trim()}
          className="btn-primary px-4"
        >
          <Send className="w-4 h-4" /> {sending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  )
}
