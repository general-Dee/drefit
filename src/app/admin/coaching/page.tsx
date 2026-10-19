"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronRight, Inbox } from "lucide-react"
import PageHeader from "@/components/ui/PageHeader"
import EmptyState from "@/components/ui/EmptyState"
import { ListRowsSkeleton } from "@/components/ui/skeletons"

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
    <div className="page-shell max-w-4xl">
      <PageHeader back={{ href: "/admin", label: "Admin" }} title="Coaching inbox" subtitle="Member conversations, newest first." />

      {loading ? (
        <ListRowsSkeleton />
      ) : threads.length === 0 ? (
        <div className="glass-card">
          <EmptyState icon={Inbox} title="Inbox zero" description="When members message their coach, conversations show up here." />
        </div>
      ) : (
        <ul className="stagger space-y-2.5">
          {threads.map((t) => (
            <li key={t.userId}>
              <Link href={`/admin/coaching/${t.userId}`} className="group glass-card card-interactive flex items-center gap-4 p-4">
                <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent/30 to-accent/5 text-xs font-semibold text-accent ring-1 ring-inset ring-accent/20">
                  {(t.userName || "?").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="truncate">{t.userName}</h3>
                    <span className="shrink-0 text-xs tabular-nums text-ink-subtle">{new Date(t.lastMessageAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-sm text-ink-muted">
                    {t.lastFromAdmin ? <span className="text-ink-subtle">You: </span> : !t.lastFromAdmin && <span className="mr-1.5 inline-block h-1.5 w-1.5 -translate-y-0.5 rounded-full bg-accent" aria-label="Awaiting reply" />}
                    {t.lastMessage}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-ink-subtle transition-transform duration-base group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
