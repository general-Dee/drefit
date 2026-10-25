"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { AnimatePresence, motion } from "framer-motion"
import { formatDistanceToNow } from "date-fns"
import { ChevronDown, Heart, MessageCircle, Send, Trophy, Users } from "lucide-react"
import PageHeader from "@/components/ui/PageHeader"
import EmptyState from "@/components/ui/EmptyState"
import Spinner from "@/components/ui/Spinner"
import { FeedSkeleton } from "@/components/ui/skeletons"
import { SPRING, reveal } from "@/components/ui/motion"
import toast from "react-hot-toast"
import type { CommunityCommentDoc, CommunityPostDoc } from "@/lib/db/schema"

export const dynamic = "force-dynamic"

interface LeaderboardEntry {
  name: string
  count: number
}

export default function CommunityPage() {
  const { data: session } = useSession()
  const userId = session?.user?.id

  const [posts, setPosts] = useState<CommunityPostDoc[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState("")
  const [posting, setPosting] = useState(false)

  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [comments, setComments] = useState<Record<string, CommunityCommentDoc[]>>({})
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [commentSubmitting, setCommentSubmitting] = useState<Record<string, boolean>>({})

  useEffect(() => {
    Promise.all([
      fetch("/api/community/posts").then((res) => res.json()),
      fetch("/api/community/leaderboard").then((res) => res.json()),
    ])
      .then(([postsData, leaderboardData]) => {
        setPosts(postsData.posts ?? [])
        setLeaderboard(leaderboardData.leaderboard ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  const handlePost = async () => {
    if (!content.trim()) return
    setPosting(true)
    try {
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Could not post")
        return
      }
      setPosts((prev) => [data.post, ...prev])
      setContent("")
    } finally {
      setPosting(false)
    }
  }

  const handleToggleLike = async (post: CommunityPostDoc) => {
    if (!userId) return
    const liked = post.likedBy.includes(userId)
    const optimisticLikedBy = liked ? post.likedBy.filter((id) => id !== userId) : [...post.likedBy, userId]
    setPosts((prev) => prev.map((p) => (p.$id === post.$id ? { ...p, likedBy: optimisticLikedBy } : p)))

    const res = await fetch(`/api/community/posts/${post.$id}/like`, { method: "POST" })
    if (!res.ok) {
      setPosts((prev) => prev.map((p) => (p.$id === post.$id ? { ...p, likedBy: post.likedBy } : p)))
      toast.error("Could not update like")
    }
  }

  const handleToggleComments = async (postId: string) => {
    const isExpanding = !expanded[postId]
    setExpanded((prev) => ({ ...prev, [postId]: isExpanding }))
    if (isExpanding && !comments[postId]) {
      const res = await fetch(`/api/community/posts/${postId}/comments`)
      const data = await res.json()
      setComments((prev) => ({ ...prev, [postId]: data.comments ?? [] }))
    }
  }

  const handleAddComment = async (postId: string) => {
    const text = (commentDrafts[postId] ?? "").trim()
    if (!text) return
    setCommentSubmitting((prev) => ({ ...prev, [postId]: true }))
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Could not add comment")
        return
      }
      setComments((prev) => ({ ...prev, [postId]: [...(prev[postId] ?? []), data.comment] }))
      setCommentDrafts((prev) => ({ ...prev, [postId]: "" }))
    } finally {
      setCommentSubmitting((prev) => ({ ...prev, [postId]: false }))
    }
  }

  return (
    <div className="page-shell">
      <PageHeader eyebrow="Community" title="Train together" subtitle="Share wins, ask questions and cheer each other on." />

      <div className="grid gap-4 md:gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-3">
          <div className="glass-card p-4">
            <label htmlFor="new-post" className="sr-only">Share your fitness journey</label>
            <textarea
              id="new-post"
              placeholder="Share your fitness journey..."
              className="input-field resize-none"
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs text-ink-subtle">Be kind. Keep it about the journey.</span>
              <button onClick={handlePost} disabled={posting || !content.trim()} className="btn-primary btn-sm w-[92px]">
                {posting ? <Spinner /> : <Send className="h-4 w-4" />} {posting ? "Posting" : "Post"}
              </button>
            </div>
          </div>

          {loading ? (
            <FeedSkeleton />
          ) : posts.length === 0 ? (
            <div className="glass-card">
              <EmptyState icon={Users} title="No posts yet" description="Be the first to share a win, a question or today's session." />
            </div>
          ) : (
            <div className="stagger space-y-3">
              {posts.map((p) => {
                const liked = !!userId && p.likedBy.includes(userId)
                const open = !!expanded[p.$id]
                return (
                  <article key={p.$id} className="glass-card p-4">
                    <header className="flex items-center gap-3">
                      <Avatar name={p.userName} />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{p.userName}</div>
                        {p.createdAt && <div className="text-xs text-ink-subtle">{timeAgo(p.createdAt)}</div>}
                      </div>
                    </header>
                    <p className="mt-3 whitespace-pre-wrap break-words text-[15px] leading-6">{p.content}</p>
                    <div className="mt-3 flex gap-1 border-t border-line pt-2">
                      <button
                        onClick={() => handleToggleLike(p)}
                        aria-pressed={liked}
                        className={`btn-ghost btn-sm gap-1.5 tabular-nums ${liked ? "!text-accent" : ""}`}
                      >
                        <motion.span key={liked ? "on" : "off"} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={SPRING} className="inline-flex">
                          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
                        </motion.span>
                        {p.likedBy.length}
                      </button>
                      <button onClick={() => handleToggleComments(p.$id)} aria-expanded={open} className="btn-ghost btn-sm gap-1.5 tabular-nums">
                        <MessageCircle className="h-4 w-4" />
                        {open ? (comments[p.$id]?.length ?? 0) : "Comments"}
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-base ${open ? "rotate-180" : ""}`} />
                      </button>
                    </div>

                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div {...reveal} className="mt-2 space-y-3 rounded-xl bg-white/[0.025] p-3">
                          {(comments[p.$id] ?? []).length === 0 && <p className="text-xs text-ink-subtle">No comments yet. Start the thread.</p>}
                          {(comments[p.$id] ?? []).map((c) => (
                            <div key={c.$id} className="flex gap-2.5 text-sm">
                              <Avatar name={c.userName} size="sm" />
                              <div className="min-w-0">
                                <span className="font-semibold">{c.userName}</span>{" "}
                                <span className="break-words text-ink-muted">{c.content}</span>
                              </div>
                            </div>
                          ))}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Add a comment..."
                              aria-label="Add a comment"
                              className="input-field flex-1 min-h-[40px] py-2 text-sm"
                              value={commentDrafts[p.$id] ?? ""}
                              onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [p.$id]: e.target.value }))}
                            />
                            <button onClick={() => handleAddComment(p.$id)} disabled={commentSubmitting[p.$id]} className="btn-secondary btn-sm w-[68px]">
                              {commentSubmitting[p.$id] ? <Spinner /> : "Add"}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </article>
                )
              })}
            </div>
          )}
        </div>

        <aside className="glass-card h-fit p-4 lg:sticky lg:top-20">
          <div className="section-title">
            <div className="flex items-center gap-2.5">
              <span className="icon-tile h-8 w-8 rounded-lg"><Trophy className="h-4 w-4" /></span>
              <h2 className="text-base">Weekly leaderboard</h2>
            </div>
          </div>
          {leaderboard.length === 0 ? (
            <EmptyState compact icon={Trophy} title="No workouts yet this week" description="Finish a session to claim the top spot." action={{ label: "Start a workout", href: "/dashboard/workouts", variant: "secondary" }} />
          ) : (
            <ol className="space-y-1">
              {leaderboard.map((entry, i) => (
                <li key={i} className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm">
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold tabular-nums ${i === 0 ? "lime-gradient" : "bg-white/[0.06] text-ink-muted"}`}>{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{entry.name}</span>
                  <span className="tabular-nums text-ink-muted">{entry.count}<span className="ml-1 text-xs text-ink-subtle">workout{entry.count === 1 ? "" : "s"}</span></span>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>
    </div>
  )
}

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initials = (name || "?").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()
  return (
    <span aria-hidden className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent/30 to-accent/5 font-semibold text-accent ring-1 ring-inset ring-accent/20 ${size === "sm" ? "h-7 w-7 text-[10px]" : "h-10 w-10 text-xs"}`}>
      {initials}
    </span>
  )
}

function timeAgo(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? "" : formatDistanceToNow(d, { addSuffix: true })
}
