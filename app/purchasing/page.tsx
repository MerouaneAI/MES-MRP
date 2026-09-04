// app/purchasing/page.tsx
import Link from "next/link"
import { desc, eq } from "drizzle-orm"
import { db } from "@/db"
import { purchaseOrders } from "@/db/schema/purchases"
import { parties } from "@/db/schema/parties"
import { Nav } from "@/components/nav"
import { currentUser } from "@/lib/session"
import { can } from "@/lib/authz"

export const dynamic = "force-dynamic"

export default async function PurchasingPage() {
  const user = await currentUser()
  const canWrite = !!user && can(user.role, "operator")
  const rows = await db
    .select({
      id: purchaseOrders.id,
      status: purchaseOrders.status,
      totalAmount: purchaseOrders.totalAmount,
      supplierName: parties.name,
    })
    .from(purchaseOrders)
    .innerJoin(parties, eq(purchaseOrders.supplierId, parties.id))
    .orderBy(desc(purchaseOrders.createdAt))

  return (
    <main style={{ padding: 24 }}>
      <Nav />
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>Purchasing</h1>
        {canWrite && <Link href="/purchasing/new">+ New purchase order</Link>}
      </header>
      {rows.length === 0 ? <p>No purchase orders yet.</p> : (
        <table cellPadding={8} style={{ borderCollapse: "collapse", marginTop: 16 }}>
          <thead><tr><th align="left">Supplier</th><th align="left">Status</th><th align="right">Total (DZD)</th><th /></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderTop: "1px solid #ddd" }}>
                <td>{r.supplierName}</td>
                <td>{r.status}</td>
                <td align="right">{r.totalAmount}</td>
                <td><Link href={`/purchasing/${r.id}`}>Open</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}