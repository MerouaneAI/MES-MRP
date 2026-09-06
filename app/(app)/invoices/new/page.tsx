// app/invoices/new/page.tsx
import { asc, inArray } from "drizzle-orm"
import { db } from "@/db"
import { parties } from "@/db/schema/parties"
import { NewInvoiceForm } from "../new-invoice-form"

export const dynamic = "force-dynamic"

export default async function NewInvoicePage() {
  const customers = await db
    .select({ id: parties.id, name: parties.name })
    .from(parties)
    .where(inArray(parties.type, ["customer", "both"]))
    .orderBy(asc(parties.name))

  return (
    <div className="space-y-6">
      <h1>New invoice</h1>
      <NewInvoiceForm customers={customers} />
    </div>
  )
}