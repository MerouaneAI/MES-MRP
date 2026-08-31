// app/lots/new/page.tsx
import { asc } from "drizzle-orm"
import { db } from "@/db"
import { items } from "@/db/schema/inventory"
import { createLot } from "@/app/actions/lots"
import { LotForm } from "../lot-form"
import { Nav } from "@/components/nav"

export const dynamic = "force-dynamic"

export default async function NewLotPage() {
  const itemOptions = await db.select({ id: items.id, name: items.name, sku: items.sku }).from(items).orderBy(asc(items.name))
  return (
    <main style={{ padding: 24 }}>
      <Nav />
      <h1>Add lot</h1>
      <LotForm action={createLot} submitLabel="Create lot" items={itemOptions} />
    </main>
  )
}