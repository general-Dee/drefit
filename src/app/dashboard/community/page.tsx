"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Heart, MessageCircle, Trophy } from "lucide-react"
import toast from "react-hot-toast"
import type { CommunityCommentDoc, CommunityPostDoc } from "@/lib/appwrite/schema"

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
    <div className="p-6 space-y-6">
      <h1 className="text-3xl">Community</h1>

      <div className="glass-card p-4">
        <textarea
          placeholder="Share your fitness journey..."
          className="w-full bg-white/5 rounded p-3"
          rows={2}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button
          onClick={handlePost}
          disabled={posting || !content.trim()}
          className="mt-2 bg-drefit-lime text-drefit-dark px-4 py-2 rounded disabled:opacity-50"
        >
          {posting ? "Posting..." : "Post"}
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : posts.length === 0 ? (
        <p className="text-gray-400">No posts yet — be the first to share something.</p>
      ) : (
        posts.map((p) => {
          const liked = !!userId && p.likedBy.includes(userId)
          return (
            <div key={p.$id} className="glass-card p-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-drefit-lime/20 flex items-center justify-center">💪</div>
                <span className="font-bold">{p.userName}</span>
              </div>
              <p className="mt-2">{p.content}</p>
              <div className="flex gap-4 mt-3">
                <button
                  onClick={() => handleToggleLike(p)}
                  className={`flex gap-1 ${liked ? "text-drefit-lime" : "text-gray-400"}`}
                >
                  <Heart className="w-4 h-4" /> {p.likedBy.length}
                </button>
                <button onClick={() => handleToggleComments(p.$id)} className="flex gap-1 text-gray-400">
                  <MessageCircle className="w-4 h-4" />
                  {expanded[p.$id] ? (comments[p.$id]?.length ?? 0) : "Comments"}
                </button>
              </div>

              {expanded[p.$id] && (
                <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                  {(comments[p.$id] ?? []).map((c) => (
                    <div key={c.$id} className="text-sm">
                      <span className="font-bold">{c.userName}</span> <span className="text-gray-300">{c.content}</span>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      className="flex-1 bg-white/5 border border-white/10 rounded p-2 text-sm"
                      value={commentDrafts[p.$id] ?? ""}
                      onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [p.$id]: e.target.value }))}
                    />
                    <button
                      onClick={() => handleAddComment(p.$id)}
                      disabled={commentSubmitting[p.$id]}
                      className="text-drefit-lime text-sm px-3 disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })
      )}

      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="text-drefit-lime" /> Weekly Leaderboard
        </div>
        {leaderboard.length === 0 ? (
          <p className="text-sm text-gray-400">No workouts completed this week yet.</p>
        ) : (
          <ol className="space-y-1 text-sm">
            {leaderboard.map((entry, i) => (
              <li key={i}>
                #{i + 1} {entry.name} ({entry.count} workout{entry.count === 1 ? "" : "s"})
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
