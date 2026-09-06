import Link from "next/link"
import { desc, eq } from "drizzle-orm"
import { db } from "@/db"
import { workOrders } from "@/db/schema/production"
import { items } from "@/db/schema/inventory"
import { currentUser } from "@/lib/session"
import { can } from "@/lib/authz"

export const dynamic = "force-dynamic"

export default async function WorkOrdersPage() {
  const user = await currentUser()
  const canWrite = !!user && can(user.role, "operator")
  const rows = await db
    .select({
      id: workOrders.id, status: workOrders.status,
      quantityPlanned: workOrders.quantityPlanned, quantityProduced: workOrders.quantityProduced,
      productName: items.name, productSku: items.sku,
    })
    .from(workOrders)
    .innerJoin(items, eq(workOrders.productItemId, items.id))
    .orderBy(desc(workOrders.createdAt))

  return (
    <div className="space-y-6">
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>Work orders</h1>
        {canWrite && <Link href="/work-orders/new">+ New work order</Link>}
      </header>
      {rows.length === 0 ? <p>No work orders yet.</p> : (
        <table cellPadding={8} style={{ borderCollapse: "collapse", marginTop: 16 }}>
          <thead><tr><th align="left">Product</th><th align="left">Status</th><th align="right">Planned</th><th align="right">Produced</th><th /></tr></thead>
          <tbody>
            {rows.map((w) => (
              <tr key={w.id} style={{ borderTop: "1px solid #ddd" }}>
                <td>{w.productName} <span style={{ color: "#999" }}>({w.productSku})</span></td>
                <td>{w.status}</td>
                <td align="right">{w.quantityPlanned}</td>
                <td align="right">{w.quantityProduced}</td>
                <td><Link href={`/work-orders/${w.id}`}>Open</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
