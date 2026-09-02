import Link from "next/link"
import { signOut } from "@/auth"

const links = [
  { href: "/parties", label: "Parties" },
  { href: "/items", label: "Items" },
  { href: "/lots", label: "Inventory" },
  { href: "/purchasing", label: "Purchasing" },
  { href: "/invoices", label: "Invoices" },
  { href: "/boms", label: "BOMs" },
  { href: "/eco", label: "ECOs" },
  { href: "/work-orders", label: "Work Orders" },
  { href: "/shopfloor", label: "Shop Floor" },
  { href: "/documents", label: "Documents" },
]

export function Nav() {
  return (
    <nav style={{ display: "flex", gap: 16, alignItems: "center", padding: "12px 0", borderBottom: "1px solid #eee", marginBottom: 16 }}>
      {links.map((l) => (
        <Link key={l.href} href={l.href}>{l.label}</Link>
      ))}
      <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }) }} style={{ marginLeft: "auto" }}>
        <button type="submit">Sign out</button>
      </form>
    </nav>
  )
}