"use client"
import "./globals.css"

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-drefit-dark">
        <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
          <div className="glass-card fade-up p-6 sm:p-8 w-full max-w-md text-center">
            <h1 className="fade-up font-bold mb-2">Something Went Wrong</h1>
            <p className="text-ink-muted mb-6">
              A critical error occurred. Please try again.
            </p>
            <button onClick={reset} className="btn-primary w-full py-3">
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
