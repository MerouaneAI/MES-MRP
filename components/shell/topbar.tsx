// components/shell/topbar.tsx
"use client"
import { usePathname } from "next/navigation"
import { Bell, Search } from "lucide-react"
import { titleForPath } from "./nav-config"
import { TopbarDate } from "./topbar-date"
import { UserMenu } from "./user-menu"
import { MobileNav } from "./mobile-nav"
import { type Role } from "@/lib/authz"

export function Topbar({ role, user }: { role: Role; user: { email: string; role: string } }) {
  const title = titleForPath(usePathname())
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-line bg-[rgba(20,20,23,0.8)] px-4 backdrop-blur-md md:px-6">
      <MobileNav role={role} user={user} />
      <h1 className="truncate font-serif text-xl text-ink">{title}</h1>
      <TopbarDate />

      <div className="ml-auto flex items-center gap-2 md:gap-3">
        {/* Ready to wire to a command palette later (Trap #11: presentational for now). */}
        <div className="hidden w-64 items-center gap-2 rounded-control border border-line bg-surface-2 px-3 py-1.5 text-sm md:flex">
          <Search size={15} className="text-ink-faint" />
          <input aria-label="Search" placeholder="Search orders, items, parties…"
            className="w-full bg-transparent text-ink outline-none placeholder:text-ink-faint" />
        </div>
        <button aria-label="Notifications"
          className="relative grid h-9 w-9 place-items-center rounded-control border border-line text-ink-muted hover:text-ink">
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-gold" />
        </button>
        <UserMenu email={user.email} role={user.role} />
      </div>
    </header>
  )
}