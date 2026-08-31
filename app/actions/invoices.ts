"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { sql } from "drizzle-orm"
import { z } from "zod"
import { auth } from "@/auth"
import { db } from "@/db"
import { invoiceCounters, invoices } from "@/db/schema/invoices"
import { FACILITY_ID } from "@/lib/constants"
import type { FormState } from "@/lib/types"

// Core: atomic, gapless invoice number. Reusable by actions, tests, and BullMQ.
// INSERT ... ON CONFLICT DO UPDATE self-initializes the counter row AND takes a
// row lock, so concurrent callers can never grab the same number -> no gaps, no dupes.
export async function createInvoiceRecord(input: {
  partyId: string
  totalAmount: string
  currency?: string
}) {
  const fiscalYear = new Date().getFullYear()

  return db.transaction(async (tx) => {
    const [counter] = await tx
      .insert(invoiceCounters)
      .values({ facilityId: FACILITY_ID, fiscalYear, lastNumber: 1 })
      .onConflictDoUpdate({
        target: [invoiceCounters.facilityId, invoiceCounters.fiscalYear],
        set: { lastNumber: sql`${invoiceCounters.lastNumber} + 1` },
      })
      .returning({ seq: invoiceCounters.lastNumber })

    const seq = counter.seq
    const invoiceNo = `${fiscalYear}/${String(seq).padStart(6, "0")}`

    const [row] = await tx.insert(invoices).values({
      facilityId: FACILITY_ID,
      partyId: input.partyId,
      fiscalYear,
      sequence: seq,
      invoiceNo,
      currency: input.currency ?? "DZD",
      totalAmount: input.totalAmount,
    }).returning()

    return row
  })
}

// Form action wrapper.
const invoiceSchema = z.object({
  partyId: z.string().uuid("Choose a customer"),
  totalAmount: z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Amount must be a number (up to 2 decimals)"),
})

export async function createInvoice(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await auth()
  if (!session?.user) return { ok: false, error: "Unauthorized" }

  const parsed = invoiceSchema.safeParse({
    partyId: formData.get("partyId"),
    totalAmount: formData.get("totalAmount") ?? "",
  })
  if (!parsed.success) {
    return { ok: false, error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors }
  }

  await createInvoiceRecord({ partyId: parsed.data.partyId, totalAmount: parsed.data.totalAmount })

  revalidatePath("/invoices")
  redirect("/invoices")
}

// NOTE: there is intentionally NO updateInvoice / deleteInvoice.
// Invoices are immutable to preserve gapless numbering (legal requirement).