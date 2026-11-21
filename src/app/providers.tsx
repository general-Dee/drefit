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
        gutter={10}
        containerStyle={{ top: 16 }}
        toastOptions={{
          duration: 3500,
          className: "drefit-toast",
          style: {
            background: "rgba(31,31,35,0.98)",
            color: "#F5F5F4",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "14px",
            padding: "10px 14px",
            fontSize: "14px",
            fontWeight: 500,
            boxShadow: "0 1px 0 rgba(255,255,255,0.06) inset, 0 16px 40px -12px rgba(0,0,0,0.8)",
            maxWidth: "min(420px, calc(100vw - 32px))",
          },
          success: { iconTheme: { primary: "#C8F135", secondary: "#0A0A0B" } },
          error: { iconTheme: { primary: "#FCA5A5", secondary: "#0A0A0B" } },
        }}
      />
      </MotionConfig>
    </SessionProvider>
  )
}
