// components/motion/reveal.tsx
"use client"
import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

export function Reveal({ children, className, stagger = 0.06, y = 12 }: {
  children: React.ReactNode; className?: string; stagger?: number; y?: number
}) {
  const scope = useRef<HTMLDivElement>(null)
  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const targets = gsap.utils.toArray<HTMLElement>(scope.current!.children)
    if (targets.length === 0) return
    gsap.from(targets, { opacity: 0, y, duration: 0.4, ease: "power2.out", stagger })
  }, { scope })
  return <div ref={scope} className={className}>{children}</div>
}