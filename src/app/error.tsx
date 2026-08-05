"use client"
import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center section-padding">
      <div className="glass-card p-8 w-full max-w-md text-center">
        <AlertTriangle className="w-10 h-10 text-drefit-lime mx-auto mb-4" />
        <h1 className="text-3xl mb-2">Something Went Wrong</h1>
        <p className="text-gray-400 mb-6">
          An unexpected error occurred. You can try again or head back to your dashboard.
        </p>
        <div className="flex flex-col gap-3">
          <button onClick={reset} className="w-full lime-gradient text-drefit-dark font-bold py-3 rounded-lg hover:scale-105 transition">
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
