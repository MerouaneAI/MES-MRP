import { asc, eq, inArray } from "drizzle-orm"
import { db } from "@/db"
import { workOrders, workOrderMaterials } from "@/db/schema/production"
import { items } from "@/db/schema/inventory"
import { Nav } from "@/components/nav"
import { DispatchBoardLive } from "./dispatch-board-live"
import { ScanForm } from "./scan-form"
import { currentUser } from "@/lib/session"
import { can } from "@/lib/authz"

export const dynamic = "force-dynamic"

export default async function ShopFloorPage() {
  const user = await currentUser()
  const canWrite = !!user && can(user.role, "operator")

  // The board = everything currently released (on the floor).
  const released = await db
    .select({
      id: workOrders.id, quantityPlanned: workOrders.quantityPlanned, scheduledFor: workOrders.scheduledFor,
      productName: items.name, productSku: items.sku,
    })
    .from(workOrders)
    .innerJoin(items, eq(workOrders.productItemId, items.id))
    .where(eq(workOrders.status, "released"))
    .orderBy(asc(workOrders.scheduledFor))

  const ids = released.map((w) => w.id)
  const materials = ids.length
    ? await db
        .select({
          workOrderId: workOrderMaterials.workOrderId, quantityRequired: workOrderMaterials.quantityRequired,
          name: items.name, unit: items.unit,
        })
        .from(workOrderMaterials)
        .innerJoin(items, eq(workOrderMaterials.componentItemId, items.id))
        .where(inArray(workOrderMaterials.workOrderId, ids))
    : []

  const byWo = new Map<string, typeof materials>()
  for (const m of materials) {
    const list = byWo.get(m.workOrderId) ?? []
    list.push(m)
    byWo.set(m.workOrderId, list)
  }

  return (
    <main style={{ padding: 24 }}>
      <Nav />
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Shop-floor dispatch</h1>
        <DispatchBoardLive />
      </header>

      {released.length === 0 ? <p>No released work orders. Release one to see it here.</p> : (
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", marginTop: 16 }}>
          {released.map((w) => (
            <section key={w.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
              <h3 style={{ margin: 0 }}>{w.productName}</h3>
              <p style={{ color: "#666", margin: "4px 0" }}>{w.productSku} · make {w.quantityPlanned}{w.scheduledFor ? ` · ${w.scheduledFor}` : ""}</p>
              <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
                {(byWo.get(w.id) ?? []).map((m, i) => (
                  <li key={i}>{m.name}: {m.quantityRequired} {m.unit}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {canWrite && <ScanForm />}
    </main>
  )
}
