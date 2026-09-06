// components/shell/topbar-date.tsx  (hydration-safe — Trap #10)
"use client"
import { useEffect, useState } from "react"

export function TopbarDate() {
  const [text, setText] = useState("")
  useEffect(() => {
    setText(new Date().toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    }))
  }, [])
  return <span className="hidden text-sm text-ink-faint md:block">{text}</span>
}