import { asc, inArray } from "drizzle-orm"
import { db } from "@/db"
import { items } from "@/db/schema/inventory"
import { Nav } from "@/components/nav"
import { NewBomForm } from "./new-bom-form"

export const dynamic = "force-dynamic"

export default async function NewBomPage() {
  // Only finished goods / WIP can be manufactured products.
  const products = await db
    .select({ id: items.id, name: items.name, sku: items.sku })
    .from(items)
    .where(inArray(items.kind, ["finished_good", "wip"]))
    .orderBy(asc(items.name))

  return (
    <main style={{ padding: 24 }}>
      <Nav />
      <h1>New BOM</h1>
      <NewBomForm products={products} />
    </main>
  )
}
