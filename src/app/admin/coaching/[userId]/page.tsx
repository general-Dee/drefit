"use client"
import { useEffect, useState } from "react"
import { MessagesSquare, Send } from "lucide-react"
import PageHeader from "@/components/ui/PageHeader"
import EmptyState from "@/components/ui/EmptyState"
import Spinner from "@/components/ui/Spinner"
import { ChatSkeleton } from "@/components/ui/skeletons"
import toast from "react-hot-toast"
import type { CoachingMessageDoc } from "@/lib/db/schema"

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
    <div className="page-shell max-w-3xl">
      <PageHeader back={{ href: "/admin/coaching", label: "Inbox" }} eyebrow="Conversation" title={memberName || "Member"} />

      <div className="glass-card overflow-hidden">
        <div className="min-h-[320px] space-y-2.5 p-4">
          {loading ? (
            <ChatSkeleton />
          ) : messages.length === 0 ? (
            <EmptyState compact icon={MessagesSquare} title="No messages yet" description="Send a first note to welcome this member." />
          ) : (
            messages.map((m) => (
              <div key={m.$id} className={`fade-up flex ${m.isFromAdmin ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-5 shadow-elev-1 ${
                    m.isFromAdmin ? "lime-gradient rounded-br-md" : "rounded-bl-md border border-line bg-surface-3 text-ink"
                  }`}
                >
                  <div className={`mb-0.5 text-[11px] font-semibold ${m.isFromAdmin ? "opacity-70" : "text-accent"}`}>{m.isFromAdmin ? "You" : m.senderName}</div>
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2 border-t border-line p-3">
          <input
            type="text"
            placeholder="Reply..."
            aria-label="Reply"
            className="input-field flex-1"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button onClick={handleSend} disabled={sending || !content.trim()} className="btn-primary w-[96px] px-0">
            {sending ? <Spinner /> : <Send className="h-4 w-4" />} {sending ? "Sending" : "Send"}
          </button>
        </div>
      </div>
    </div>
  )
}
