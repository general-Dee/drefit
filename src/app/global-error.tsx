"use client"
import "./globals.css"
import { ServerCrash } from "lucide-react"
import ErrorScreen from "@/components/ui/ErrorScreen"
import { bodyFont, displayFont } from "./fonts"

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en" className={`dark ${displayFont.variable} ${bodyFont.variable}`}>
      <body>
        <ErrorScreen
          icon={ServerCrash}
          title="Aremo hit a snag"
          description="A critical error occurred. Please try again."
          onRetry={reset}
          homeHref="/"
          homeLabel="Go to home"
          digest={error?.digest}
        />
      </body>
    </html>
  )
}
