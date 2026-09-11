import { asc, eq, inArray } from "drizzle-orm"
import { Factory } from "lucide-react"
import { db } from "@/db"
import { workOrders, workOrderMaterials } from "@/db/schema/production"
import { items } from "@/db/schema/inventory"
import { DispatchBoardLive } from "./dispatch-board-live"
import { ScanForm } from "./scan-form"
import { currentUser } from "@/lib/session"
import { can } from "@/lib/authz"
import { PageHeader, EmptyState } from "@/components/ui"
import { Reveal } from "@/components/motion/reveal"

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
    <div className="space-y-6">
      <PageHeader
        title="Shop-floor dispatch"
        description="Live view of released work orders."
        actions={<DispatchBoardLive />}
      />

      {released.length === 0 ? (
        <EmptyState icon={Factory} title="No released work orders" description="Release a work order to see it here." />
      ) : (
        <Reveal className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
          {released.map((w) => (
            <section key={w.id} className="card p-4">
              <h3 className="m-0 font-serif text-ink">{w.productName}</h3>
              <p className="text-ink-muted text-sm mt-1">{w.productSku} · make {w.quantityPlanned}{w.scheduledFor ? ` · ${w.scheduledFor}` : ""}</p>
              <ul className="mt-2 pl-4 text-sm list-disc text-ink-muted">
                {(byWo.get(w.id) ?? []).map((m, i) => (
                  <li key={i}>{m.name}: {m.quantityRequired} {m.unit}</li>
                ))}
              </ul>
            </section>
          ))}
        </Reveal>
      )}

      {canWrite && <ScanForm />}
    </div>
  )
}
