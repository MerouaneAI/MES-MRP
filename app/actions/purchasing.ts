"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { and, eq } from "drizzle-orm"
import { z } from "zod"
import { authorize } from "@/lib/authz"
import { db } from "@/db"
import { purchaseOrders, purchaseOrderLines } from "@/db/schema/purchases"
import { items, lots } from "@/db/schema/inventory"
import { FACILITY_ID } from "@/lib/constants"
import { addMoney, multiplyMoney } from "@/lib/money"
import { recordAudit } from "@/lib/audit"
import type { FormState } from "@/lib/types"

// ---------- Create the PO header ----------
const poSchema = z.object({
  supplierId: z.string().uuid("Choose a supplier"),
  expectedAt: z.string().trim().optional(),
})

export async function createPurchaseOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  const gate = await authorize("operator")
  if (!gate.ok) return gate

  const parsed = poSchema.safeParse({
    supplierId: formData.get("supplierId"),
    expectedAt: formData.get("expectedAt") ?? "",
  })
  if (!parsed.success) {
    return { ok: false, error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const [po] = await db.insert(purchaseOrders).values({
    facilityId: FACILITY_ID,
    supplierId: parsed.data.supplierId,
    status: "draft",
    totalAmount: "0",
    expectedAt: parsed.data.expectedAt ? new Date(parsed.data.expectedAt) : null, // timestamp col = Date
  }).returning()

  revalidatePath("/purchasing")
  redirect(`/purchasing/${po.id}`)
}

// ---------- Add / remove lines (recompute header total in the SAME txn) ----------
const lineSchema = z.object({
  itemId: z.string().uuid("Choose an item"),
  quantity: z.string().trim().regex(/^\d+(\.\d{1,3})?$/, "Quantity must be a number (up to 3 decimals)"),
  unitPrice: z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Unit price must be a number (up to 2 decimals)"),
})

export async function addPurchaseOrderLine(poId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const gate = await authorize("operator")
  if (!gate.ok) return gate

  const parsed = lineSchema.safeParse({
    itemId: formData.get("itemId"),
    quantity: formData.get("quantity") ?? "",
    unitPrice: formData.get("unitPrice") ?? "",
  })
  if (!parsed.success) {
    return { ok: false, error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const [po] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, poId))
  if (!po) return { ok: false, error: "Order not found." }
  if (po.status === "received") return { ok: false, error: "This order is received and locked." }

  const [item] = await db.select().from(items).where(eq(items.id, parsed.data.itemId))
  if (!item) return { ok: false, error: "Item not found." }

  const lineTotal = multiplyMoney(parsed.data.quantity, parsed.data.unitPrice)

  await db.transaction(async (tx) => {
    await tx.insert(purchaseOrderLines).values({
      poId,
      itemId: parsed.data.itemId,
      description: item.name,                 // snapshot the name at order time
      quantity: parsed.data.quantity,
      unitPrice: parsed.data.unitPrice,
      lineTotal,
    })
    const lines = await tx.select({ lineTotal: purchaseOrderLines.lineTotal }).from(purchaseOrderLines).where(eq(purchaseOrderLines.poId, poId))
    await tx.update(purchaseOrders).set({ totalAmount: addMoney(...lines.map((l) => l.lineTotal)) }).where(eq(purchaseOrders.id, poId))
  })

  revalidatePath(`/purchasing/${poId}`)
  return { ok: true }
}

export async function removePurchaseOrderLine(formData: FormData): Promise<void> {
  const gate = await authorize("operator")
  if (!gate.ok) throw new Error(gate.error)

  const lineId = String(formData.get("lineId") ?? "")
  const poId = String(formData.get("poId") ?? "")
  if (!lineId || !poId) return

  const [po] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, poId))
  if (!po || po.status === "received") return

  await db.transaction(async (tx) => {
    await tx.delete(purchaseOrderLines).where(eq(purchaseOrderLines.id, lineId))
    const lines = await tx.select({ lineTotal: purchaseOrderLines.lineTotal }).from(purchaseOrderLines).where(eq(purchaseOrderLines.poId, poId))
    await tx.update(purchaseOrders).set({ totalAmount: addMoney(...lines.map((l) => l.lineTotal)) }).where(eq(purchaseOrders.id, poId))
  })

  revalidatePath(`/purchasing/${poId}`)
}

// ---------- State machine: draft -> ordered -> received ----------
export async function markOrdered(formData: FormData): Promise<void> {
  const gate = await authorize("operator")
  if (!gate.ok) throw new Error(gate.error)

  const poId = String(formData.get("poId") ?? "")
  if (!poId) return

  // Conditional flip so it only moves forward from draft.
  await db.update(purchaseOrders)
    .set({ status: "ordered" })
    .where(and(eq(purchaseOrders.id, poId), eq(purchaseOrders.status, "draft")))

  revalidatePath("/purchasing")
  revalidatePath(`/purchasing/${poId}`)
}

// The important one: receiving CREATES inventory lots, transactionally + idempotently.
export async function receivePurchaseOrder(formData: FormData): Promise<void> {
  const gate = await authorize("operator")
  if (!gate.ok) throw new Error(gate.error)

  const poId = String(formData.get("poId") ?? "")
  if (!poId) return

  const createdLotIds: string[] = []

  await db.transaction(async (tx) => {
    // Idempotency: flip ordered -> received exactly once. If no row comes back it
    // was already received (or not orderable) -> do nothing, never double-stock.
    const [po] = await tx.update(purchaseOrders)
      .set({ status: "received", receivedAt: new Date() })
      .where(and(eq(purchaseOrders.id, poId), eq(purchaseOrders.status, "ordered")))
      .returning()
    if (!po) return

    const lines = await tx.select().from(purchaseOrderLines).where(eq(purchaseOrderLines.poId, poId))
    for (const line of lines) {
      const [item] = await tx.select().from(items).where(eq(items.id, line.itemId))
      const producedAt = new Date().toISOString().slice(0, 10)
      const expiresAt = item?.shelfLifeDays != null
        ? new Date(Date.now() + item.shelfLifeDays * 86400000).toISOString().slice(0, 10)
        : null
      const lotNumber = `${item?.sku ?? "LOT"}-${po.id.slice(0, 8)}-${line.id.slice(0, 4)}`

      const [newLot] = await tx.insert(lots).values({
        itemId: line.itemId,
        lotNumber,
        quantityOnHand: line.quantity,   // numeric string, already 3 dp
        producedAt,
        expiresAt,
        sourcePoId: po.id,
      }).returning({ id: lots.id })
      
      createdLotIds.push(newLot.id)
    }

    await recordAudit(tx, {
      user: gate.user, action: "purchase_order.receive", entity: "purchase_order", entityId: poId,
      summary: `Received PO ${poId.slice(0, 8)} — created ${lines.length} lot(s)`,
    })
  })

  revalidatePath("/purchasing")
  revalidatePath(`/purchasing/${poId}`)
  revalidatePath("/lots")               // inventory changed too
  
  if (createdLotIds.length > 0) {
    redirect(`/lots/bulk-edit?ids=${createdLotIds.join(",")}`)
  }
}