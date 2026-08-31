import { notFound } from "next/navigation"
import Link from "next/link"
import { asc, eq } from "drizzle-orm"
import { db } from "@/db"
import { purchaseOrders, purchaseOrderLines } from "@/db/schema/purchases"
import { parties } from "@/db/schema/parties"
import { items } from "@/db/schema/inventory"
import { markOrdered, receivePurchaseOrder, removePurchaseOrderLine } from "@/app/actions/purchasing"
import { AddLineForm } from "../add-line-form"
import { Nav } from "@/components/nav"

export const dynamic = "force-dynamic"

export default async function PurchaseOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [po] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id))
  if (!po) notFound()

  const [supplier] = await db.select().from(parties).where(eq(parties.id, po.supplierId))
  const lines = await db.select().from(purchaseOrderLines).where(eq(purchaseOrderLines.poId, id))
  const itemOptions = await db.select({ id: items.id, name: items.name, sku: items.sku }).from(items).orderBy(asc(items.name))

  const editable = po.status !== "received"

  return (
    <main style={{ padding: 24 }}>
      <Nav />
      <Link href="/purchasing">← Back to purchasing</Link>
      <h1>Purchase order</h1>
      <p>Supplier: <b>{supplier?.name ?? "—"}</b> · Status: <b>{po.status}</b> · Total: <b>{po.totalAmount} DZD</b></p>

      <h2>Lines</h2>
      {lines.length === 0 ? <p>No lines yet.</p> : (
        <table cellPadding={8} style={{ borderCollapse: "collapse" }}>
          <thead><tr><th align="left">Item</th><th align="right">Qty</th><th align="right">Unit price</th><th align="right">Line total</th>{editable && <th />}</tr></thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.id} style={{ borderTop: "1px solid #ddd" }}>
                <td>{l.description ?? l.itemId}</td>
                <td align="right">{l.quantity}</td>
                <td align="right">{l.unitPrice}</td>
                <td align="right">{l.lineTotal}</td>
                {editable && (
                  <td>
                    <form action={removePurchaseOrderLine}>
                      <input type="hidden" name="lineId" value={l.id} />
                      <input type="hidden" name="poId" value={po.id} />
                      <button type="submit">Remove</button>
                    </form>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editable && <AddLineForm poId={po.id} items={itemOptions} />}

      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        {po.status === "draft" && (
          <form action={markOrdered}>
            <input type="hidden" name="poId" value={po.id} />
            <button type="submit">Mark as ordered</button>
          </form>
        )}
        {po.status === "ordered" && (
          <form action={receivePurchaseOrder}>
            <input type="hidden" name="poId" value={po.id} />
            <button type="submit">Receive → create lots</button>
          </form>
        )}
        {po.status === "received" && <p>✅ Received. Inventory lots were created.</p>}
      </div>
    </main>
  )
}