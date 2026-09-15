"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { and, eq, inArray, sql } from "drizzle-orm"
import { z } from "zod"
import { authorize } from "@/lib/authz"
import { db } from "@/db"
import { boms, workOrders, workOrderMaterials } from "@/db/schema/production"
import { items, lots, lotGenealogy } from "@/db/schema/inventory"
import { FACILITY_ID } from "@/lib/constants"
import { allocateFefo, checkAvailability, checkCapacity, explodeBom } from "@/lib/mrp"
import { publishShopFloorEvent } from "@/lib/shopfloor"
import { recordAudit } from "@/lib/audit"
import type { FormState } from "@/lib/types"

// ---------- Create (status = planned, snapshot the active BOM) ----------
const woSchema = z.object({
  productItemId: z.string().uuid("Choose a product"),
  quantityPlanned: z.string().trim().regex(/^\d+(\.\d{1,3})?$/, "Quantity must be a number (up to 3 decimals)"),
  workCenterId: z.string().uuid().optional().or(z.literal("")),
  scheduledFor: z.string().trim().optional(),
})

export async function createWorkOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  const gate = await authorize("work-orders", "write")
  if (!gate.ok) return gate

  const parsed = woSchema.safeParse({
    productItemId: formData.get("productItemId"),
    quantityPlanned: formData.get("quantityPlanned") ?? "",
    workCenterId: formData.get("workCenterId") ?? "",
    scheduledFor: formData.get("scheduledFor") ?? "",
  })
  if (!parsed.success) {
    return { ok: false, error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const [active] = await db.select().from(boms)
    .where(and(eq(boms.productItemId, parsed.data.productItemId), eq(boms.status, "active")))
  if (!active) return { ok: false, error: "This product has no active BOM. Create and activate one first." }

  const [wo] = await db.insert(workOrders).values({
    facilityId: FACILITY_ID,
    productItemId: parsed.data.productItemId,
    bomId: active.id,                                   // snapshot the version in use
    workCenterId: parsed.data.workCenterId ? parsed.data.workCenterId : null,
    quantityPlanned: parsed.data.quantityPlanned,
    status: "planned",
    scheduledFor: parsed.data.scheduledFor ? parsed.data.scheduledFor : null,
  }).returning()

  revalidatePath("/work-orders")
  redirect(`/work-orders/${wo.id}`)
}

// ---------- Release: run MRP, validate, snapshot requirements ----------
export async function releaseWorkOrder(workOrderId: string): Promise<FormState> {
  const gate = await authorize("work-orders", "write")
  if (!gate.ok) return gate

  try {
    await db.transaction(async (tx) => {
      const [wo] = await tx.select().from(workOrders).where(eq(workOrders.id, workOrderId))
      if (!wo) throw new Error("Work order not found.")
      if (wo.status !== "planned") throw new Error("Only planned work orders can be released.")

      const requirements = await explodeBom(tx, wo.bomId, wo.quantityPlanned)
      if (requirements.length === 0) throw new Error("The BOM has no components.")

      const shortages = await checkAvailability(tx, requirements)
      if (shortages.length > 0) {
        const msg = shortages.map((s) => `${s.componentItemId} (need ${s.required}, have ${s.available})`).join("; ")
        throw new Error(`Insufficient materials: ${msg}`)
      }

      const capacity = await checkCapacity(tx, wo.workCenterId, wo.scheduledFor, wo.quantityPlanned)
      if (!capacity.ok) {
        throw new Error(`Over capacity: center allows ${capacity.capacityPerDay}/day, already ${capacity.scheduledLoad} scheduled, requested ${capacity.requested}.`)
      }

      // Snapshot the explosion for the shop floor + audit (do NOT consume yet — Trap #7).
      await tx.delete(workOrderMaterials).where(eq(workOrderMaterials.workOrderId, workOrderId))
      await tx.insert(workOrderMaterials).values(requirements.map((r) => ({
        workOrderId,
        componentItemId: r.componentItemId,
        quantityRequired: r.quantityRequired,
      })))

      await tx.update(workOrders).set({ status: "released" }).where(eq(workOrders.id, workOrderId))
    })
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Release failed." }
  }

  await publishShopFloorEvent({ type: "work_order_released", workOrderId })
  revalidatePath("/work-orders")
  revalidatePath(`/work-orders/${workOrderId}`)
  revalidatePath("/shopfloor")
  return { ok: true }
}

// ---------- Complete: the crown jewel (atomic + idempotent) ----------
export async function completeWorkOrder(workOrderId: string): Promise<FormState> {
  const gate = await authorize("work-orders", "write")
  if (!gate.ok) return gate

  let newLotId: string | undefined

  try {
    await db.transaction(async (tx) => {
      // Idempotent + atomic: flip released -> completed exactly once. If no row
      // comes back, it was already completed (or not releasable) -> no-op.
      const [wo] = await tx.update(workOrders)
        .set({ status: "completed", completedAt: new Date() })
        .where(and(eq(workOrders.id, workOrderId), eq(workOrders.status, "released")))
        .returning()
      if (!wo) return

      const [product] = await tx.select().from(items).where(eq(items.id, wo.productItemId))

      // 1) Create the finished-goods OUTPUT lot (full yield in simple mode).
      const producedAt = new Date().toISOString().slice(0, 10)
      const expiresAt = product?.shelfLifeDays != null
        ? new Date(Date.now() + product.shelfLifeDays * 86400000).toISOString().slice(0, 10)
        : null
      const [outputLot] = await tx.insert(lots).values({
        itemId: wo.productItemId,
        lotNumber: `${product?.sku ?? "FG"}-WO-${wo.id.slice(0, 8)}`,
        quantityOnHand: wo.quantityPlanned,
        producedAt,
        expiresAt,
      }).returning()
      
      newLotId = outputLot.id

      // 2) Explode + consume input lots FEFO, writing genealogy per consumed lot.
      const requirements = await explodeBom(tx, wo.bomId, wo.quantityPlanned)
      for (const req of requirements) {
        const allocations = await allocateFefo(tx, req.componentItemId, req.quantityRequired)
        for (const a of allocations) {
          await tx.update(lots)
            .set({ quantityOnHand: sql`${lots.quantityOnHand} - ${a.quantity}::numeric` })
            .where(eq(lots.id, a.lotId))
          await tx.insert(lotGenealogy).values({
            outputLotId: outputLot.id,   // finished
            inputLotId: a.lotId,         // consumed
            quantityUsed: a.quantity,
          })
        }
      }

      // 3) Record produced qty + link the output lot.
      await tx.update(workOrders)
        .set({ quantityProduced: wo.quantityPlanned, outputLotId: outputLot.id })
        .where(eq(workOrders.id, workOrderId))

      await recordAudit(tx, {
        user: gate.user, action: "work_order.complete", entity: "work_order", entityId: workOrderId,
        summary: `Completed WO ${workOrderId.slice(0, 8)} → output lot ${outputLot.id.slice(0, 8)}`,
      })
    })
  } catch (e) {
    // Any shortage/error rolls back the WHOLE transaction — WO stays released.
    return { ok: false, error: e instanceof Error ? e.message : "Completion failed." }
  }

  await publishShopFloorEvent({ type: "work_order_completed", workOrderId })
  revalidatePath("/work-orders")
  revalidatePath(`/work-orders/${workOrderId}`)
  revalidatePath("/lots")
  revalidatePath("/shopfloor")
  
  if (newLotId) {
    redirect(`/lots/${newLotId}/edit`)
  }
  
  return { ok: true }
}

// ---------- Cancel (only before completion; nothing consumed yet) ----------
export async function cancelWorkOrder(formData: FormData): Promise<void> {
  const gate = await authorize("work-orders", "write")
  if (!gate.ok) throw new Error(gate.error)

  const workOrderId = String(formData.get("workOrderId") ?? "")
  if (!workOrderId) return

  await db.update(workOrders)
    .set({ status: "cancelled" })
    .where(and(eq(workOrders.id, workOrderId), inArray(workOrders.status, ["planned", "released"])))

  await publishShopFloorEvent({ type: "work_order_cancelled", workOrderId })
  revalidatePath("/work-orders")
  revalidatePath(`/work-orders/${workOrderId}`)
  revalidatePath("/shopfloor")
}
