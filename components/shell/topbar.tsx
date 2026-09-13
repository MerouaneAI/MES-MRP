// components/shell/topbar.tsx
"use client"
import { usePathname } from "next/navigation"
import { titleForPath } from "./nav-config"
import { TopbarDate } from "./topbar-date"
import { UserMenu } from "./user-menu"
import { MobileNav } from "./mobile-nav"
import { type Role } from "@/lib/roles"

export function Topbar({ role, user }: { role: Role; user: { email: string; role: string } }) {
  const title = titleForPath(usePathname())
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-line bg-[rgba(20,20,23,0.8)] px-4 backdrop-blur-md md:px-6">
      <MobileNav role={role} user={user} />
      <h1 className="truncate font-serif text-xl text-ink">{title}</h1>
      <TopbarDate />

      <div className="ml-auto flex items-center gap-2 md:gap-3">
        <UserMenu email={user.email} role={user.role} />
      </div>
    </header>
  )
}