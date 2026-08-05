"use client"
import "./globals.css"

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-drefit-dark">
        <div className="min-h-screen flex items-center justify-center section-padding">
          <div className="glass-card p-8 w-full max-w-md text-center">
            <h1 className="text-3xl mb-2">Something Went Wrong</h1>
            <p className="text-gray-400 mb-6">
              A critical error occurred. Please try again.
            </p>
            <button onClick={reset} className="w-full lime-gradient text-drefit-dark font-bold py-3 rounded-lg hover:scale-105 transition">
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
