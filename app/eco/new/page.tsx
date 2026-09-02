import { asc, eq } from "drizzle-orm"
import { db } from "@/db"
import { boms } from "@/db/schema/production"
import { items } from "@/db/schema/inventory"
import { Nav } from "@/components/nav"
import { NewEcoForm } from "./new-eco-form"

export const dynamic = "force-dynamic"

export default async function NewEcoPage() {
  const active = await db
    .select({ productId: boms.productItemId, name: items.name, sku: items.sku })
    .from(boms)
    .innerJoin(items, eq(boms.productItemId, items.id))
    .where(eq(boms.status, "active"))
    .orderBy(asc(items.name))

  const drafts = await db
    .select({ id: boms.id, productId: boms.productItemId, version: boms.version })
    .from(boms)
    .where(eq(boms.status, "draft"))
    .orderBy(asc(boms.version))

  return (
    <main style={{ padding: 24 }}>
      <Nav />
      <h1>New ECO</h1>
      <NewEcoForm products={active} drafts={drafts} />
    </main>
  )
}
