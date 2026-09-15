// components/shell/sidebar.tsx
"use client"
import Link from "next/link"
import { Crown } from "lucide-react"
import { NAV } from "./nav-config"
import { NavLink } from "./nav-link"
import { canAccess, type PermissionMap } from "@/lib/roles"

type ShellUser = { email: string; roleName: string }

export function SidebarContent({ permissions, user, onNavigate }: {
  permissions: PermissionMap; user: ShellUser; onNavigate?: () => void
}) {
  return (
    <div className="flex h-full flex-col bg-sidebar">
      <Link href="/dashboard" onClick={onNavigate} className="flex items-center gap-3 px-5 py-5">
        <span className="grid h-9 w-9 place-items-center rounded-tile bg-gold-soft text-gold ring-1 ring-[rgba(201,169,97,0.35)]">
          <Crown size={18} />
        </span>
        <span className="leading-tight">
          <span className="block font-serif text-lg text-ink">AurumMES</span>
          <span className="label">Enterprise Suite</span>
        </span>
      </Link>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-2">
        {NAV.map((section) => {
          const items = section.items.filter((i) => canAccess(permissions, i.page, "view"))
          if (items.length === 0) return null
          return (
            <div key={section.heading}>
              <p className="label px-3 pb-2">{section.heading}</p>
              <div className="space-y-0.5">
                {items.map((i) => (
                  <NavLink key={i.href} href={i.href} label={i.label} icon={i.icon} onNavigate={onNavigate} />
                ))}
              </div>
            </div>
          )
        })}
      </nav>

      <div className="border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-control px-2 py-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gold-soft font-semibold text-gold">
            {user.email.slice(0, 2).toUpperCase()}
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm text-ink">{user.email}</span>
            <span className="block text-xs capitalize text-ink-faint">{user.roleName}</span>
          </span>
        </div>
      </div>
    </div>
  )
}

export function Sidebar({ permissions, user }: { permissions: PermissionMap; user: ShellUser }) {
  return (
    <aside className="hidden w-[260px] shrink-0 border-r border-line lg:block">
      <div className="sticky top-0 h-screen">
        <SidebarContent permissions={permissions} user={user} />
      </div>
    </aside>
  )
}