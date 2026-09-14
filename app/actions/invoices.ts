"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { and, eq, sql } from "drizzle-orm"
import { z } from "zod"
import { authorize } from "@/lib/authz"
import { db } from "@/db"
import { invoiceCounters, invoiceLines, invoices } from "@/db/schema/invoices"
import { lots } from "@/db/schema/inventory"
import { FACILITY_ID } from "@/lib/constants"
import { recordAudit } from "@/lib/audit"
import { addMoney, multiplyMoney } from "@/lib/money"
import { allocateFefo, Tx } from "@/lib/mrp"
import { addQty } from "@/lib/quantity"
import type { FormState } from "@/lib/types"

// Core: atomic, gapless invoice number. Reusable by actions, tests, and BullMQ.
export async function createInvoiceRecord(input: {
  partyId: string
  totalAmount?: string
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
      totalAmount: input.totalAmount ?? "0",
      status: "draft",
    }).returning()

    return row
  })
}

// ---------- 1. Create Invoice ----------

const invoiceSchema = z.object({
  partyId: z.string().uuid("Choose a customer"),
})

export async function createInvoice(_prev: FormState, formData: FormData): Promise<FormState> {
  const gate = await authorize("operator")
  if (!gate.ok) return gate

  const parsed = invoiceSchema.safeParse({ partyId: formData.get("partyId") })
  if (!parsed.success) {
    return { ok: false, error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const row = await createInvoiceRecord({ partyId: parsed.data.partyId, totalAmount: "0" })
  await recordAudit(db, {
    user: gate.user, action: "invoice.create", entity: "invoice", entityId: row.id,
    summary: `Created draft invoice ${row.invoiceNo}`,
  })

  revalidatePath("/invoices")
  redirect(`/invoices/${row.id}`)
}

// ---------- 2. Lines Management ----------

const lineSchema = z.object({
  itemId: z.string().uuid("Choose an item"),
  quantity: z.string().trim().regex(/^\d+(\.\d{1,3})?$/, "Quantity must be a number (up to 3 decimals)"),
  unitPrice: z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Price must be a number (up to 2 decimals)"),
})

async function updateInvoiceTotal(tx: Tx, invoiceId: string) {
  const allLines = await tx.select({ lineTotal: invoiceLines.lineTotal }).from(invoiceLines).where(eq(invoiceLines.invoiceId, invoiceId))
  const totalAmount = allLines.reduce((sum, l) => addMoney(sum, l.lineTotal), "0")
  await tx.update(invoices).set({ totalAmount }).where(eq(invoices.id, invoiceId))
}

export async function addInvoiceLine(invoiceId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const gate = await authorize("operator")
  if (!gate.ok) return gate

  const parsed = lineSchema.safeParse({
    itemId: formData.get("itemId"),
    quantity: formData.get("quantity") ?? "",
    unitPrice: formData.get("unitPrice") ?? "",
  })
  if (!parsed.success) {
    return { ok: false, error: "Please fix errors.", fieldErrors: parsed.error.flatten().fieldErrors }
  }

  await db.transaction(async (tx) => {
    const [inv] = await tx.select({ status: invoices.status }).from(invoices).where(eq(invoices.id, invoiceId))
    if (inv?.status !== "draft") throw new Error("Can only add lines to draft invoices.")

    const lineTotal = multiplyMoney(parsed.data.quantity, parsed.data.unitPrice)
    await tx.insert(invoiceLines).values({
      invoiceId,
      itemId: parsed.data.itemId,
      quantity: parsed.data.quantity,
      unitPrice: parsed.data.unitPrice,
      lineTotal,
    })
    await updateInvoiceTotal(tx, invoiceId)
  })

  revalidatePath(`/invoices/${invoiceId}`)
  return { ok: true }
}

export async function removeInvoiceLine(formData: FormData): Promise<void> {
  const gate = await authorize("operator")
  if (!gate.ok) throw new Error(gate.error)

  const lineId = String(formData.get("lineId") ?? "")
  const invoiceId = String(formData.get("invoiceId") ?? "")
  if (!lineId || !invoiceId) return

  await db.transaction(async (tx) => {
    const [inv] = await tx.select({ status: invoices.status }).from(invoices).where(eq(invoices.id, invoiceId))
    if (inv?.status !== "draft") throw new Error("Can only remove lines from draft invoices.")

    await tx.delete(invoiceLines).where(eq(invoiceLines.id, lineId))
    await updateInvoiceTotal(tx, invoiceId)
  })
  revalidatePath(`/invoices/${invoiceId}`)
}

// ---------- 3. Lifecycle (Issue, Deliver, Return) ----------

export async function issueInvoice(formData: FormData): Promise<void> {
  const gate = await authorize("operator")
  if (!gate.ok) throw new Error(gate.error)

  const invoiceId = String(formData.get("invoiceId") ?? "")
  if (!invoiceId) return

  await db.transaction(async (tx) => {
    const [inv] = await tx.update(invoices)
      .set({ status: "issued", issuedAt: new Date() })
      .where(and(eq(invoices.id, invoiceId), eq(invoices.status, "draft")))
      .returning()

    if (inv) {
      await recordAudit(tx, {
        user: gate.user, action: "invoice.issue", entity: "invoice", entityId: invoiceId,
        summary: `Issued invoice ${inv.invoiceNo}`,
      })
    }
  })
  revalidatePath(`/invoices/${invoiceId}`)
  revalidatePath("/invoices")
}

export async function deliverInvoice(formData: FormData): Promise<void> {
  const gate = await authorize("operator")
  if (!gate.ok) throw new Error(gate.error)

  const invoiceId = String(formData.get("invoiceId") ?? "")
  if (!invoiceId) return

  try {
    await db.transaction(async (tx) => {
      const [inv] = await tx.update(invoices)
        .set({ status: "delivered", deliveredAt: new Date() })
        .where(and(eq(invoices.id, invoiceId), eq(invoices.status, "issued")))
        .returning()
      if (!inv) return

      const lines = await tx.select().from(invoiceLines).where(eq(invoiceLines.invoiceId, invoiceId))

      // Deduct inventory per line using FEFO
      for (const line of lines) {
        // We delete the original line, and if FEFO splits it across multiple lots, we insert multiple lines.
        await tx.delete(invoiceLines).where(eq(invoiceLines.id, line.id))

        const allocations = await allocateFefo(tx, line.itemId, line.quantity)
        for (const alloc of allocations) {
          // Deduct from lot
          await tx.update(lots)
            .set({ quantityOnHand: sql`${lots.quantityOnHand} - ${alloc.quantity}::numeric` })
            .where(eq(lots.id, alloc.lotId))

          // Insert specific line for this lot
          await tx.insert(invoiceLines).values({
            invoiceId,
            itemId: line.itemId,
            lotId: alloc.lotId,
            quantity: alloc.quantity,
            unitPrice: line.unitPrice,
            lineTotal: multiplyMoney(alloc.quantity, line.unitPrice), // Split line total proportionally
          })
        }
      }

      await recordAudit(tx, {
        user: gate.user, action: "invoice.deliver", entity: "invoice", entityId: invoiceId,
        summary: `Delivered invoice ${inv.invoiceNo} and deducted inventory`,
      })
    })
  } catch (error: any) {
    // If FEFO fails (e.g. insufficient stock), the whole transaction rolls back!
    throw new Error(`Delivery failed: ${error.message}`)
  }
  revalidatePath(`/invoices/${invoiceId}`)
  revalidatePath("/invoices")
}

export async function returnInvoice(formData: FormData): Promise<void> {
  const gate = await authorize("operator")
  if (!gate.ok) throw new Error(gate.error)

  const invoiceId = String(formData.get("invoiceId") ?? "")
  if (!invoiceId) return

  await db.transaction(async (tx) => {
    const [inv] = await tx.update(invoices)
      .set({ status: "returned", returnedAt: new Date() })
      .where(and(eq(invoices.id, invoiceId), eq(invoices.status, "delivered")))
      .returning()
    if (!inv) return

    const lines = await tx.select().from(invoiceLines).where(eq(invoiceLines.invoiceId, invoiceId))
    
    // Restore inventory to original lots
    for (const line of lines) {
      if (line.lotId) {
        await tx.update(lots)
          .set({ quantityOnHand: sql`${lots.quantityOnHand} + ${line.quantity}::numeric` })
          .where(eq(lots.id, line.lotId))
      }
    }

    await recordAudit(tx, {
      user: gate.user, action: "invoice.return", entity: "invoice", entityId: invoiceId,
      summary: `Returned (cancelled) invoice ${inv.invoiceNo} and restored inventory`,
    })
  })
  revalidatePath(`/invoices/${invoiceId}`)
  revalidatePath("/invoices")
}