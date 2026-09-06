import { notFound } from "next/navigation"
import Link from "next/link"
import { and, asc, eq, ne } from "drizzle-orm"
import { db } from "@/db"
import { boms, bomLines } from "@/db/schema/production"
import { items } from "@/db/schema/inventory"
import { activateBom, removeBomLine } from "@/app/actions/boms"
import { BomLineForm } from "../bom-line-form"

export const dynamic = "force-dynamic"

export default async function BomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [bom] = await db.select().from(boms).where(eq(boms.id, id))
  if (!bom) notFound()

  const [product] = await db.select().from(items).where(eq(items.id, bom.productItemId))
  const lines = await db
    .select({ id: bomLines.id, quantityPer: bomLines.quantityPer, componentName: items.name, componentSku: items.sku, unit: items.unit })
    .from(bomLines)
    .innerJoin(items, eq(bomLines.componentItemId, items.id))
    .where(eq(bomLines.bomId, id))

  const components = await db
    .select({ id: items.id, name: items.name, sku: items.sku })
    .from(items)
    .where(ne(items.id, bom.productItemId))
    .orderBy(asc(items.name))

  const [active] = await db.select({ id: boms.id }).from(boms)
    .where(and(eq(boms.productItemId, bom.productItemId), eq(boms.status, "active")))

  const editable = bom.status === "draft"
  const canActivate = editable && lines.length > 0 && !active

  return (
    <div className="space-y-6">
      <Link href="/boms">← Back to BOMs</Link>
      <h1>{product?.name} — v{bom.version}</h1>
      <p>Status: <b>{bom.status}</b>{bom.notes ? ` · ${bom.notes}` : ""}</p>

      <h2>Components</h2>
      {lines.length === 0 ? <p>No components yet.</p> : (
        <table cellPadding={8} style={{ borderCollapse: "collapse" }}>
          <thead><tr><th align="left">Component</th><th align="right">Qty per unit</th>{editable && <th />}</tr></thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.id} style={{ borderTop: "1px solid #ddd" }}>
                <td>{l.componentName} <span style={{ color: "#999" }}>({l.componentSku})</span></td>
                <td align="right">{l.quantityPer} {l.unit}</td>
                {editable && (
                  <td>
                    <form action={removeBomLine}>
                      <input type="hidden" name="lineId" value={l.id} />
                      <input type="hidden" name="bomId" value={bom.id} />
                      <button type="submit">Remove</button>
                    </form>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editable && <BomLineForm bomId={bom.id} components={components} />}

      <div style={{ marginTop: 24 }}>
        {canActivate && (
          <form action={activateBom}>
            <input type="hidden" name="bomId" value={bom.id} />
            <button type="submit">Activate this version</button>
          </form>
        )}
        {editable && active && <p>An active version already exists — publish this one through an <Link href="/eco/new">ECO</Link>.</p>}
        {bom.status === "active" && <p>✅ This is the active recipe.</p>}
        {bom.status === "archived" && <p>Archived (superseded by a newer version).</p>}
      </div>
    </div>
  )
}
