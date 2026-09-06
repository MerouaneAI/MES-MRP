// components/shell/nav-config.ts
import {
  LayoutDashboard, Users, Package, Boxes, ShoppingCart, FileText,
  Layers, ClipboardList, Factory, Files, Replace,
  ShieldCheck, ScrollText, CircleUser, type LucideIcon,
} from "lucide-react"
import type { Role } from "@/lib/authz"

export type NavItem = { label: string; href: string; icon: LucideIcon; minRole: Role }
export type NavSection = { heading: string; items: NavItem[] }

export const NAV: NavSection[] = [
  {
    heading: "Operations",
    items: [
      { label: "Dashboard",   href: "/dashboard",   icon: LayoutDashboard, minRole: "viewer" },
      { label: "Parties",     href: "/parties",     icon: Users,           minRole: "viewer" },
      { label: "Items",       href: "/items",       icon: Package,         minRole: "viewer" },
      { label: "Inventory",   href: "/lots",        icon: Boxes,           minRole: "viewer" },
      { label: "Purchasing",  href: "/purchasing",  icon: ShoppingCart,    minRole: "viewer" },
      { label: "Invoices",    href: "/invoices",    icon: FileText,        minRole: "viewer" },
      { label: "BOMs",        href: "/boms",        icon: Layers,          minRole: "viewer" },
      { label: "Work Orders", href: "/work-orders", icon: ClipboardList,   minRole: "viewer" },
      { label: "Shop Floor",  href: "/shopfloor",   icon: Factory,         minRole: "viewer" },
      { label: "Documents",   href: "/documents",   icon: Files,           minRole: "viewer" },
      { label: "ECOs",        href: "/eco",         icon: Replace,         minRole: "viewer" },
    ],
  },
  {
    heading: "Administration",
    items: [
      { label: "Users",   href: "/users",   icon: ShieldCheck, minRole: "admin"  },
      { label: "Audit",   href: "/audit",   icon: ScrollText,  minRole: "admin"  },
      { label: "Account", href: "/account", icon: CircleUser,  minRole: "viewer" },
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