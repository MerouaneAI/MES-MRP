// app/(app)/template.tsx
"use client"
import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

export default function Template({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    gsap.from(ref.current, { opacity: 0, y: 8, duration: 0.25, ease: "power2.out" })
  }, { scope: ref })
  return <div ref={ref}>{children}</div>
}