"use client"
import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"
import ErrorScreen from "@/components/ui/ErrorScreen"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <ErrorScreen
      icon={AlertTriangle}
      title="Something went wrong"
      description="An unexpected error occurred. You can try again or head back to your dashboard."
      onRetry={reset}
      digest={error.digest}
    />
  )
}
