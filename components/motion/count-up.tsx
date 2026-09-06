// components/motion/count-up.tsx
"use client"
import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

export function CountUp({ value, prefix = "", suffix = "", decimals = 0, className }: {
  value: number; prefix?: string; suffix?: string; decimals?: number; className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  useGSAP(() => {
    const el = ref.current
    if (!el) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const state = { n: reduced ? value : 0 }
    const render = () => { el.textContent = `${prefix}${state.n.toFixed(decimals)}${suffix}` }
    render()
    if (reduced) return
    gsap.to(state, { n: value, duration: 1, ease: "power2.out", onUpdate: render })
  }, { dependencies: [value] })
  return <span ref={ref} className={className} />
}