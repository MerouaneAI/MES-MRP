import { notFound } from "next/navigation"
import Link from "next/link"
import { eq } from "drizzle-orm"
import { Layers } from "lucide-react"
import { db } from "@/db"
import { workOrders, workOrderMaterials, boms } from "@/db/schema/production"
import { items, lots, lotGenealogy } from "@/db/schema/inventory"
import { cancelWorkOrder } from "@/app/actions/work-orders"
import { ReleaseButton, CompleteButton } from "../wo-buttons"
import {
  PageHeader, Panel, Table, THead, TH, TBody, TR, TD,
  StatusBadge, EmptyState, Button, buttonClass,
} from "@/components/ui"
import { Reveal } from "@/components/motion/reveal"

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
    <div className="space-y-6">
      <Link href="/work-orders" className={buttonClass({ variant: "ghost", size: "sm" })}>← Back to work orders</Link>
      <PageHeader
        title={`Work order WO-${id.slice(0, 8).toUpperCase()} — ${product?.name}`}
        description={`BOM v${bom?.version} · planned ${wo.quantityPlanned} · produced ${wo.quantityProduced}`}
        actions={<StatusBadge status={wo.status} />}
      />

      <Panel title="Materials" subtitle="MRP explosion (snapshot at release)">
        {materials.length === 0 ? (
          <EmptyState icon={Layers} title="Not yet released" description="Release this work order to run the MRP explosion." />
        ) : (
          <Reveal>
            <Table>
              <THead><TH>Component</TH><TH className="text-right">Required</TH></THead>
              <TBody>
                {materials.map((m) => (
                  <TR key={m.id}>
                    <TD className="font-medium">{m.name} <span className="text-ink-faint font-normal">({m.sku})</span></TD>
                    <TD align="right">{m.quantityRequired} {m.unit}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Reveal>
        )}
      </Panel>

      {genealogy.length > 0 && (
        <Panel title="Traceability" subtitle="Consumed lots → output">
          <Reveal>
            <Table>
              <THead><TH>Input lot</TH><TH>Material</TH><TH className="text-right">Qty used</TH></THead>
              <TBody>
                {genealogy.map((g) => (
                  <TR key={g.id}>
                    <TD className="font-medium">{g.lotNumber}</TD>
                    <TD>{g.itemName}</TD>
                    <TD align="right">{g.quantityUsed}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Reveal>
        </Panel>
      )}

      <div className="flex gap-4 items-start">
        {wo.status === "planned" && <ReleaseButton workOrderId={wo.id} />}
        {wo.status === "released" && <CompleteButton workOrderId={wo.id} />}
        {(wo.status === "planned" || wo.status === "released") && (
          <form action={cancelWorkOrder}>
            <input type="hidden" name="workOrderId" value={wo.id} />
            <Button type="submit" variant="danger">Cancel</Button>
          </form>
        )}
        {wo.status === "completed" && <p className="text-sm text-success">✅ Completed. Output lot created and genealogy recorded.</p>}
        {wo.status === "cancelled" && <p className="text-sm text-ink-muted">Cancelled.</p>}
      </div>
    </div>
  )
}
