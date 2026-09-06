import { and, asc, eq } from "drizzle-orm"
import { db } from "@/db"
import { boms, workCenters } from "@/db/schema/production"
import { items } from "@/db/schema/inventory"
import { NewWorkOrderForm } from "./new-wo-form"
import { PageHeader } from "@/components/ui/page-header"

export const dynamic = "force-dynamic"

export default async function NewWorkOrderPage() {
  // Only products with an active BOM can be built.
  const products = await db
    .select({ id: items.id, name: items.name, sku: items.sku })
    .from(items)
    .innerJoin(boms, and(eq(boms.productItemId, items.id), eq(boms.status, "active")))
    .orderBy(asc(items.name))

  const centers = await db
    .select({ id: workCenters.id, name: workCenters.name })
    .from(workCenters)
    .orderBy(asc(workCenters.name))

  return (
    <div className="space-y-6">
      <PageHeader title="New work order" />
      <NewWorkOrderForm products={products} workCenters={centers} />
    </div>
  )
}
