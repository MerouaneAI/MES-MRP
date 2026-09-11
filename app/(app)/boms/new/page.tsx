import { asc, inArray } from "drizzle-orm"
import { db } from "@/db"
import { items } from "@/db/schema/inventory"
import { NewBomForm } from "./new-bom-form"
import { PageHeader } from "@/components/ui"

export const dynamic = "force-dynamic"

export default async function NewBomPage() {
  // Only finished goods / WIP can be manufactured products.
  const products = await db
    .select({ id: items.id, name: items.name, sku: items.sku })
    .from(items)
    .where(inArray(items.kind, ["finished_good", "wip"]))
    .orderBy(asc(items.name))

  return (
    <div className="space-y-6">
      <PageHeader title="New BOM" />
      <NewBomForm products={products} />
    </div>
  )
}
