import { notFound } from "next/navigation"
import { asc, inArray } from "drizzle-orm"
import { db } from "@/db"
import { items, lots } from "@/db/schema/inventory"
import { bulkUpdateLots } from "@/app/actions/lots"
import { BulkLotForm } from "./bulk-lot-form"
import { PageHeader } from "@/components/ui"

export const dynamic = "force-dynamic"

export default async function BulkEditLotsPage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const { ids } = await searchParams
  if (!ids) notFound()

  const lotIds = ids.split(",").filter(Boolean)
  if (lotIds.length === 0) notFound()

  const dbLots = await db.select().from(lots).where(inArray(lots.id, lotIds))
  if (dbLots.length === 0) notFound()

  // Ensure they are ordered exactly as they were provided in the URL for consistent UX
  const orderedLots = lotIds.map(id => dbLots.find(l => l.id === id)).filter(Boolean) as typeof dbLots

  const itemOptions = await db
    .select({ id: items.id, name: items.name, sku: items.sku })
    .from(items)
    .orderBy(asc(items.name))

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Review Received Lots" 
        description="Verify or update the lot numbers and expiry dates for the newly created inventory." 
      />
      <BulkLotForm action={bulkUpdateLots} items={itemOptions} lots={orderedLots} />
    </div>
  )
}
