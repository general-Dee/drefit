"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { Heart, MessageCircle, Trophy } from "lucide-react"

const posts = [{ id:1, user:"Chidi O.", content:"Just completed week 3! Feeling strong 💪", likes:24, comments:5 }]
export default function CommunityPage() {
  const [liked, setLiked] = useState<number[]>([])
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl">Community</h1>
      <div className="glass-card p-4"><textarea placeholder="Share your fitness journey..." className="w-full bg-white/5 rounded p-3" rows={2}/><button className="mt-2 bg-drefit-lime text-drefit-dark px-4 py-2 rounded">Post</button></div>
      {posts.map(p => <div key={p.id} className="glass-card p-4"><div className="flex items-center gap-2"><div className="w-10 h-10 rounded-full bg-drefit-lime/20 flex items-center justify-center">💪</div><span className="font-bold">{p.user}</span></div><p className="mt-2">{p.content}</p><div className="flex gap-4 mt-3"><button onClick={()=>setLiked(liked.includes(p.id)? liked.filter(i=>i!==p.id):[...liked,p.id])} className={`flex gap-1 ${liked.includes(p.id)?"text-drefit-lime":"text-gray-400"}`}><Heart className="w-4 h-4"/> {liked.includes(p.id)?p.likes+1:p.likes}</button><button className="flex gap-1 text-gray-400"><MessageCircle className="w-4 h-4"/> {p.comments}</button></div></div>)}
      <div className="glass-card p-4"><Trophy className="text-drefit-lime"/> Weekly Leaderboard: #1 Emeka (2840 pts)</div>
    </div>
  )
}
