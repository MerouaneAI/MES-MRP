// app/lots/new/page.tsx
import { asc } from "drizzle-orm"
import { db } from "@/db"
import { items } from "@/db/schema/inventory"
import { createLot } from "@/app/actions/lots"
import { LotForm } from "../lot-form"
import { PageHeader } from "@/components/ui/page-header"

export const dynamic = "force-dynamic"

export default async function NewLotPage() {
  const itemOptions = await db.select({ id: items.id, name: items.name, sku: items.sku }).from(items).orderBy(asc(items.name))
  return (
    <div className="space-y-6">
      <PageHeader title="Add lot" />
      <LotForm action={createLot} submitLabel="Create lot" items={itemOptions} />
    </div>
  )
}