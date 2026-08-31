// app/lots/[id]/edit/page.tsx
import { notFound } from "next/navigation"
import { asc, eq } from "drizzle-orm"
import { db } from "@/db"
import { lots, items } from "@/db/schema/inventory"
import { updateLot } from "@/app/actions/lots"
import { LotForm } from "../../lot-form"
import { Nav } from "@/components/nav"

export const dynamic = "force-dynamic"

export default async function EditLotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [lot] = await db.select().from(lots).where(eq(lots.id, id))
  if (!lot) notFound()

  const itemOptions = await db.select({ id: items.id, name: items.name, sku: items.sku }).from(items).orderBy(asc(items.name))
  const action = updateLot.bind(null, lot.id)

  return (
    <main style={{ padding: 24 }}>
      <Nav />
      <h1>Edit lot</h1>
      <LotForm
        action={action}
        submitLabel="Save changes"
        items={itemOptions}
        defaults={{
          itemId: lot.itemId,
          lotNumber: lot.lotNumber,
          quantityOnHand: lot.quantityOnHand,
          producedAt: lot.producedAt ?? "",
          expiresAt: lot.expiresAt ?? "",
        }}
      />
    </main>
  )
}