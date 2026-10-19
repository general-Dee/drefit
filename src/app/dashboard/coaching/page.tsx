"use client"
import { useEffect, useState } from "react"
import { MessageCircle, MessagesSquare, RefreshCw, Send } from "lucide-react"
import PageHeader from "@/components/ui/PageHeader"
import EmptyState from "@/components/ui/EmptyState"
import Spinner from "@/components/ui/Spinner"
import { ChatSkeleton } from "@/components/ui/skeletons"
import toast from "react-hot-toast"
import type { CoachingMessageDoc } from "@/lib/appwrite/schema"
import CoachWhatsAppButton from "@/components/CoachWhatsAppButton"

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
    <div className="page-shell max-w-3xl">
      <PageHeader
        eyebrow="Coaching"
        title="Your coach"
        subtitle="Ask anything about your training, meals or schedule."
        action={
          <>
            <button onClick={handleRefresh} disabled={refreshing} className="icon-btn" aria-label="Refresh messages" title="Refresh">
              <RefreshCw className={`h-[18px] w-[18px] ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <CoachWhatsAppButton />
          </>
        }
      />

      <div className="glass-card overflow-hidden">
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <span className="icon-tile h-10 w-10 rounded-full"><MessageCircle className="h-[18px] w-[18px]" /></span>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">Drefit coaching team</div>
            <div className="text-xs text-ink-subtle">Usually replies within a day</div>
          </div>
        </div>
        <div className="min-h-[320px] space-y-2.5 p-4">
          {loading ? (
            <ChatSkeleton />
          ) : messages.length === 0 ? (
            <EmptyState
              compact
              icon={MessagesSquare}
              title="Start the conversation"
              description="Say hello and tell your coach what you're working towards."
            />
          ) : (
            messages.map((m) => (
              <div key={m.$id} className={`fade-up flex ${m.isFromAdmin ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-5 shadow-elev-1 ${
                    m.isFromAdmin ? "rounded-bl-md border border-line bg-surface-3 text-ink" : "lime-gradient rounded-br-md"
                  }`}
                >
                  <div className={`mb-0.5 text-[11px] font-semibold ${m.isFromAdmin ? "text-accent" : "opacity-70"}`}>{m.isFromAdmin ? "Coach" : "You"}</div>
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2 border-t border-line p-3">
          <input
            type="text"
            placeholder="Message your coach..."
            aria-label="Message your coach"
            className="input-field flex-1"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button onClick={handleSend} disabled={sending || !content.trim()} className="btn-primary w-[96px] px-0" aria-label="Send message">
            {sending ? <Spinner /> : <Send className="h-4 w-4" />} {sending ? "Sending" : "Send"}
          </button>
        </div>
      </div>
    </div>
  )
}
