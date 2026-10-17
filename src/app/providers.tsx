"use client"

import { SessionProvider } from "next-auth/react"
import { Toaster } from "react-hot-toast"
import { MotionConfig } from "framer-motion"
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <MotionConfig reducedMotion="user">
      <ServiceWorkerRegistrar />
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: "#18181B", color: "#F5F5F4", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px" },
          success: { iconTheme: { primary: "#C8F135", secondary: "#0A0A0B" } },
        }}
      />
      </MotionConfig>
    </SessionProvider>
  )
}
