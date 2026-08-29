"use server"
import { db } from "@/db"
import { invoiceCounters, invoices } from "@/db/schema/invoices"
import { sql } from "drizzle-orm"

export async function createInvoice(input: {
  facilityId: string; partyId: string; totalAmount: string; currency?: string
}) {
  const fiscalYear = new Date().getFullYear()

  return db.transaction(async (tx) => {
    // Atomically create-or-increment the counter row.
    // INSERT ... ON CONFLICT DO UPDATE acquires a row-level lock.
    // Any concurrent transaction targeting the same (facilityId, fiscalYear)
    // will BLOCK here until this transaction commits — guaranteeing:
    //   • No duplicate sequence numbers (two invoices can't read the same counter)
    //   • No gaps (if this transaction fails, the counter is never incremented)
    const [counter] = await tx
      .insert(invoiceCounters)
      .values({ facilityId: input.facilityId, fiscalYear, lastNumber: 1 })
      .onConflictDoUpdate({
        target: [invoiceCounters.facilityId, invoiceCounters.fiscalYear],
        set: { lastNumber: sql`${invoiceCounters.lastNumber} + 1` },
      })
      .returning({ seq: invoiceCounters.lastNumber })

    const seq = counter.seq
    const invoiceNo = `${fiscalYear}/${String(seq).padStart(6, "0")}`

    const [row] = await tx.insert(invoices).values({
      facilityId: input.facilityId, partyId: input.partyId,
      fiscalYear, sequence: seq, invoiceNo,
      currency: input.currency ?? "DZD", totalAmount: input.totalAmount,
    }).returning()

    return row
  })
}
