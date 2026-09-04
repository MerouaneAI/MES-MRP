import Link from "next/link"
import { desc, eq } from "drizzle-orm"
import { db } from "@/db"
import { engineeringChangeOrders, boms } from "@/db/schema/production"
import { items } from "@/db/schema/inventory"
import { applyEco, cancelEco } from "@/app/actions/eco"
import { Nav } from "@/components/nav"
import { currentUser } from "@/lib/session"
import { can } from "@/lib/authz"

export const dynamic = "force-dynamic"

export default async function EcoPage() {
  const user = await currentUser()
  const isAdmin = !!user && can(user.role, "admin")
  const rows = await db
    .select({
      id: engineeringChangeOrders.id,
      reason: engineeringChangeOrders.reason,
      status: engineeringChangeOrders.status,
      productName: items.name,
      toVersion: boms.version,
    })
    .from(engineeringChangeOrders)
    .innerJoin(items, eq(engineeringChangeOrders.productItemId, items.id))
    .innerJoin(boms, eq(engineeringChangeOrders.toBomId, boms.id))
    .orderBy(desc(engineeringChangeOrders.createdAt))

  return (
    <main style={{ padding: 24 }}>
      <Nav />
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>Engineering change orders</h1>
        {isAdmin && <Link href="/eco/new">+ New ECO</Link>}
      </header>
      {rows.length === 0 ? <p>No ECOs yet.</p> : (
        <table cellPadding={8} style={{ borderCollapse: "collapse", marginTop: 16 }}>
          <thead><tr><th align="left">Product</th><th align="left">Target</th><th align="left">Reason</th><th align="left">Status</th><th /></tr></thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id} style={{ borderTop: "1px solid #ddd" }}>
                <td>{e.productName}</td>
                <td>v{e.toVersion}</td>
                <td>{e.reason}</td>
                <td>{e.status}</td>
                <td style={{ display: "flex", gap: 8 }}>
                  {e.status === "draft" && isAdmin && (
                    <>
                      <form action={applyEco}>
                        <input type="hidden" name="ecoId" value={e.id} />
                        <button type="submit">Apply</button>
                      </form>
                      <form action={cancelEco}>
                        <input type="hidden" name="ecoId" value={e.id} />
                        <button type="submit">Cancel</button>
                      </form>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}
