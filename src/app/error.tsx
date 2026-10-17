"use client"
import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
      <div className="glass-card fade-up p-6 sm:p-8 w-full max-w-md text-center">
        <AlertTriangle className="w-10 h-10 text-drefit-lime mx-auto mb-4" />
        <h1 className="fade-up font-bold mb-2">Something Went Wrong</h1>
        <p className="text-ink-muted mb-6">
          An unexpected error occurred. You can try again or head back to your dashboard.
        </p>
        <div className="flex flex-col gap-3">
          <button onClick={reset} className="btn-primary w-full py-3">
            Try Again
          </button>
          <Link href="/dashboard" className="text-drefit-lime text-sm">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
