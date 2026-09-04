import Link from "next/link"
import { signOut } from "@/auth"
import { currentUser } from "@/lib/session"
import { can } from "@/lib/authz"

const base = [
  { href: "/parties", label: "Parties" },
  { href: "/items", label: "Items" },
  { href: "/lots", label: "Inventory" },
  { href: "/purchasing", label: "Purchasing" },
  { href: "/invoices", label: "Invoices" },
  { href: "/boms", label: "BOMs" },
  { href: "/work-orders", label: "Work orders" },
  { href: "/shopfloor", label: "Shop-floor" },
  { href: "/documents", label: "Documents" },
]

export async function Nav() {
  const user = await currentUser()
  const isAdmin = !!user && can(user.role, "admin")
  return (
    <nav style={{ display: "flex", gap: 16, alignItems: "center", padding: "12px 0", borderBottom: "1px solid #eee", marginBottom: 16, flexWrap: "wrap" }}>
      {base.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
      {isAdmin && <Link href="/eco">ECOs</Link>}
      {isAdmin && <Link href="/users">Users</Link>}
      {isAdmin && <Link href="/audit">Audit</Link>}
      <Link href="/account">Account</Link>
      <span style={{ marginLeft: "auto", color: "#666" }}>{user ? `${user.email} · ${user.role}` : ""}</span>
      <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }) }}>
        <button type="submit">Sign out</button>
      </form>
    </nav>
  )
}