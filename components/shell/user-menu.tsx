// components/shell/user-menu.tsx
"use client"
import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { CircleUser, LogOut, ChevronDown } from "lucide-react"
import { signOutAction } from "@/app/actions/auth-ui"

export function UserMenu({ email, role }: { email: string; role: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-control border border-line bg-surface px-2 py-1.5 text-sm text-ink hover:border-line-strong">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-gold-soft text-xs font-semibold text-gold">
          {email.slice(0, 2).toUpperCase()}
        </span>
        <span className="hidden capitalize text-ink-muted sm:block">{role}</span>
        <ChevronDown size={15} className="text-ink-faint" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-control border border-line bg-surface shadow-card">
          <div className="border-b border-line px-3 py-2.5">
            <p className="truncate text-sm text-ink">{email}</p>
            <p className="text-xs capitalize text-ink-faint">{role}</p>
          </div>
          <Link href="/account" className="flex items-center gap-2 px-3 py-2.5 text-sm text-ink-muted hover:bg-surface-2 hover:text-ink">
            <CircleUser size={16} /> My account
          </Link>
          <form action={signOutAction}>
            <button type="submit" className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-danger hover:bg-danger-soft">
              <LogOut size={16} /> Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  )
}