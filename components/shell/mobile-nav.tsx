// components/shell/mobile-nav.tsx
"use client"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import { SidebarContent } from "./sidebar"
import { type Role } from "@/lib/roles"

export function MobileNav({ role, user }: { role: Role; user: { email: string; role: string } }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Open menu"
        className="grid h-9 w-9 place-items-center rounded-control border border-line text-ink-muted hover:text-ink lg:hidden">
        <Menu size={18} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[280px] border-r border-line shadow-card">
            <button onClick={() => setOpen(false)} aria-label="Close menu"
              className="absolute right-3 top-4 z-10 grid h-8 w-8 place-items-center rounded-control text-ink-muted hover:text-ink">
              <X size={18} />
            </button>
            <SidebarContent role={role} user={user} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}