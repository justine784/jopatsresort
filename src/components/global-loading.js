"use client"

import { useEffect, useState } from "react"
import { Logo } from "@/components/logo"

export function GlobalLoading() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Show loading for initial page load
    const timer = setTimeout(() => {
      setLoading(false)
    }, 2000) // Show for 2 seconds

    return () => clearTimeout(timer)
  }, [])

  if (!loading) return null

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-[9999]">
      <div className="flex flex-col items-center gap-6">
        <div className="animate-pulse">
          <Logo className="scale-200" />
        </div>
        <div className="flex gap-2">
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
        </div>
        <p className="text-muted-foreground text-sm mt-2">Loading Jopats Resort...</p>
      </div>
    </div>
  )
}
