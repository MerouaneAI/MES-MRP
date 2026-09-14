import { asc, eq } from "drizzle-orm"
import { db } from "@/db"
import { items } from "@/db/schema/inventory"
import { NewBomForm } from "./new-bom-form"
import { PageHeader } from "@/components/ui"

export const dynamic = "force-dynamic"

export default async function NewBomPage() {
  // Only finished goods can be manufactured products.
  const products = await db
    .select({ id: items.id, name: items.name, sku: items.sku })
    .from(items)
    .where(eq(items.kind, "finished_good"))
    .orderBy(asc(items.name))

  return (
    <div className="space-y-6">
      <PageHeader title="New BOM" />
      <NewBomForm products={products} />
    </div>
  )
}
