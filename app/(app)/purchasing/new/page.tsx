// app/purchasing/new/page.tsx
import { asc, inArray } from "drizzle-orm"
import { db } from "@/db"
import { parties } from "@/db/schema/parties"
import { NewPurchaseOrderForm } from "../new-po-form"

export const dynamic = "force-dynamic"

export default async function NewPurchaseOrderPage() {
  const suppliers = await db
    .select({ id: parties.id, name: parties.name })
    .from(parties)
    .where(inArray(parties.type, ["supplier", "both"]))
    .orderBy(asc(parties.name))

  return (
    <div className="space-y-6">
      <h1>New purchase order</h1>
      <NewPurchaseOrderForm suppliers={suppliers} />
    </div>
  )
}