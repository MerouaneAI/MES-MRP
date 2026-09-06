// components/shell/nav-link.tsx
"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/cn"

export function NavLink({ href, label, icon: Icon, onNavigate }: {
  href: string; label: string; icon: LucideIcon; onNavigate?: () => void
}) {
  const pathname = usePathname()
  const active = pathname === href || pathname.startsWith(href + "/")
  return (
    <Link
      href={href}
      onClick={onNavigate}
      data-active={active}
      className={cn(
        "group relative flex items-center gap-3 rounded-control px-3 py-2 text-sm transition-colors",
        active ? "bg-gold-soft text-ink" : "text-ink-muted hover:bg-surface-2 hover:text-ink",
      )}
    >
      <span className={cn(
        "absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-gold transition-opacity",
        active ? "opacity-100" : "opacity-0",
      )} />
      <Icon size={18} strokeWidth={1.75}
        className={cn(active ? "text-gold" : "text-ink-faint group-hover:text-ink-muted")} />
      {label}
    </Link>
  )
}