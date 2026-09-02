import { notFound } from "next/navigation"
import Link from "next/link"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { workOrders, workOrderMaterials, boms } from "@/db/schema/production"
import { items, lots, lotGenealogy } from "@/db/schema/inventory"
import { cancelWorkOrder } from "@/app/actions/work-orders"
import { ReleaseButton, CompleteButton } from "../wo-buttons"
import { Nav } from "@/components/nav"

export const dynamic = "force-dynamic"

export default async function WorkOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [wo] = await db.select().from(workOrders).where(eq(workOrders.id, id))
  if (!wo) notFound()

  const [product] = await db.select().from(items).where(eq(items.id, wo.productItemId))
  const [bom] = await db.select().from(boms).where(eq(boms.id, wo.bomId))

  const materials = await db
    .select({ id: workOrderMaterials.id, quantityRequired: workOrderMaterials.quantityRequired, name: items.name, sku: items.sku, unit: items.unit })
    .from(workOrderMaterials)
    .innerJoin(items, eq(workOrderMaterials.componentItemId, items.id))
    .where(eq(workOrderMaterials.workOrderId, id))

  const genealogy = wo.outputLotId
    ? await db
        .select({ id: lotGenealogy.id, quantityUsed: lotGenealogy.quantityUsed, lotNumber: lots.lotNumber, itemName: items.name })
        .from(lotGenealogy)
        .innerJoin(lots, eq(lotGenealogy.inputLotId, lots.id))
        .innerJoin(items, eq(lots.itemId, items.id))
        .where(eq(lotGenealogy.outputLotId, wo.outputLotId))
    : []

  return (
    <main style={{ padding: 24 }}>
      <Nav />
      <Link href="/work-orders">← Back to work orders</Link>
      <h1>Work order — {product?.name}</h1>
      <p>Status: <b>{wo.status}</b> · BOM v{bom?.version} · Planned: <b>{wo.quantityPlanned}</b> · Produced: <b>{wo.quantityProduced}</b></p>

      <h2>Materials (MRP explosion)</h2>
      {materials.length === 0 ? <p>Not yet released — release to run the MRP explosion.</p> : (
        <table cellPadding={8} style={{ borderCollapse: "collapse" }}>
          <thead><tr><th align="left">Component</th><th align="right">Required</th></tr></thead>
          <tbody>
            {materials.map((m) => (
              <tr key={m.id} style={{ borderTop: "1px solid #ddd" }}>
                <td>{m.name} <span style={{ color: "#999" }}>({m.sku})</span></td>
                <td align="right">{m.quantityRequired} {m.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {genealogy.length > 0 && (
        <>
          <h2>Traceability (consumed lots → output)</h2>
          <table cellPadding={8} style={{ borderCollapse: "collapse" }}>
            <thead><tr><th align="left">Input lot</th><th align="left">Material</th><th align="right">Qty used</th></tr></thead>
            <tbody>
              {genealogy.map((g) => (
                <tr key={g.id} style={{ borderTop: "1px solid #ddd" }}>
                  <td>{g.lotNumber}</td>
                  <td>{g.itemName}</td>
                  <td align="right">{g.quantityUsed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <div style={{ display: "flex", gap: 16, marginTop: 24, alignItems: "start" }}>
        {wo.status === "planned" && <ReleaseButton workOrderId={wo.id} />}
        {wo.status === "released" && <CompleteButton workOrderId={wo.id} />}
        {(wo.status === "planned" || wo.status === "released") && (
          <form action={cancelWorkOrder}>
            <input type="hidden" name="workOrderId" value={wo.id} />
            <button type="submit">Cancel</button>
          </form>
        )}
        {wo.status === "completed" && <p>✅ Completed. Output lot created and genealogy recorded.</p>}
        {wo.status === "cancelled" && <p>Cancelled.</p>}
      </div>
    </main>
  )
}
