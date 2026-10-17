"use client"
import { MessageCircle } from "lucide-react"
import { buildCoachWhatsAppLink } from "@/lib/whatsapp/coach-link"

// Hidden unless NEXT_PUBLIC_COACH_WHATSAPP is set to a valid number.
export default function CoachWhatsAppButton({ className = "" }: { className?: string }) {
  const href = buildCoachWhatsAppLink(process.env.NEXT_PUBLIC_COACH_WHATSAPP, "Hi coach, I'm messaging from Drefit.")
  if (!href) return null
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 font-semibold text-black hover:opacity-90 ${className}`}
    >
      <MessageCircle className="w-4 h-4" /> Chat with your coach
    </a>
  )
}
