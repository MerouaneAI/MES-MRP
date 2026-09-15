// components/shell/nav-config.ts
import {
  LayoutDashboard, Users, Package, Boxes, ShoppingCart, FileText,
  Layers, ClipboardList, Factory, Files, Replace,
  ShieldCheck, ScrollText, CircleUser, type LucideIcon,
} from "lucide-react"
import type { PageKey } from "@/lib/roles"

export type NavItem = { label: string; href: string; icon: LucideIcon; page: PageKey }
export type NavSection = { heading: string; items: NavItem[] }

export const NAV: NavSection[] = [
  {
    heading: "Operations",
    items: [
      { label: "Dashboard",   href: "/dashboard",   icon: LayoutDashboard, page: "dashboard" },
      { label: "Parties",     href: "/parties",     icon: Users,           page: "parties" },
      { label: "Items",       href: "/items",       icon: Package,         page: "items" },
      { label: "Inventory",   href: "/lots",        icon: Boxes,           page: "lots" },
      { label: "Purchasing",  href: "/purchasing",  icon: ShoppingCart,    page: "purchasing" },
      { label: "Invoices",    href: "/invoices",    icon: FileText,        page: "invoices" },
      { label: "BOMs",        href: "/boms",        icon: Layers,          page: "boms" },
      { label: "Work Orders", href: "/work-orders", icon: ClipboardList,   page: "work-orders" },
      { label: "Shop Floor",  href: "/shopfloor",   icon: Factory,         page: "shopfloor" },
      { label: "Documents",   href: "/documents",   icon: Files,           page: "documents" },
      { label: "ECOs",        href: "/eco",         icon: Replace,         page: "eco" },
    ],
  },
  {
    heading: "Administration",
    items: [
      { label: "Users",   href: "/users",   icon: ShieldCheck, page: "users" },
      { label: "Audit",   href: "/audit",   icon: ScrollText,  page: "audit" },
      { label: "Account", href: "/account", icon: CircleUser,  page: "account" },
    ],
  },
]

// Topbar title = the deepest nav item whose href prefixes the current path.
export function titleForPath(pathname: string): string {
  const all = NAV.flatMap((s) => s.items)
  const match = all
    .filter((i) => pathname === i.href || pathname.startsWith(i.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0]
  return match?.label ?? "Dashboard"
}