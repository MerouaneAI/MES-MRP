// components/shell/topbar-date.tsx  (hydration-safe — Trap #10)
"use client"
import { useSyncExternalStore } from "react"

const fmt = (d: Date) => d.toLocaleDateString("en-US", {
  weekday: "long", year: "numeric", month: "long", day: "numeric",
})

const subscribe = () => () => {}
const getSnapshot = () => fmt(new Date())
const getServerSnapshot = () => ""

export function TopbarDate() {
  const text = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return <span className="hidden text-sm text-ink-faint md:block">{text}</span>
}