import { and, asc, eq, gt, sql } from "drizzle-orm"
import { db } from "@/db"
import { lots } from "@/db/schema/inventory"
import { bomLines, workCenters, workOrders } from "@/db/schema/production"
import { addQty, compareQty, minQty, requirementFor, subtractQty } from "@/lib/quantity"

// The transaction handle type, derived from db.transaction's callback.
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

export type Requirement = { componentItemId: string; quantityRequired: string }
export type Allocation = { lotId: string; quantity: string }
export type Shortage = { componentItemId: string; required: string; available: string }
export type CapacityResult =
  | { ok: true }
  | { ok: false; capacityPerDay: string; scheduledLoad: string; requested: string }

// Explode a BOM into per-component requirements for a planned quantity.
export async function explodeBom(tx: Tx, bomId: string, quantityPlanned: string): Promise<Requirement[]> {
  const lines = await tx
    .select({ componentItemId: bomLines.componentItemId, quantityPer: bomLines.quantityPer })
    .from(bomLines)
    .where(eq(bomLines.bomId, bomId))
  return lines.map((l) => ({
    componentItemId: l.componentItemId,
    quantityRequired: requirementFor(l.quantityPer, quantityPlanned),
  }))
}

// Read-only availability precheck (used at release; no lock needed).
export async function checkAvailability(tx: Tx, requirements: Requirement[]): Promise<Shortage[]> {
  const shortages: Shortage[] = []
  for (const req of requirements) {
    const [row] = await tx
      .select({ total: sql<string>`coalesce(sum(${lots.quantityOnHand}), 0)` })
      .from(lots)
      .where(eq(lots.itemId, req.componentItemId))
    const available = row?.total ?? "0"
    if (compareQty(available, req.quantityRequired) < 0) {
      shortages.push({ componentItemId: req.componentItemId, required: req.quantityRequired, available })
    }
  }
  return shortages
}

// FEFO allocation WITH row locks. Must run inside a transaction. Throws on shortage.
export async function allocateFefo(tx: Tx, componentItemId: string, quantityRequired: string): Promise<Allocation[]> {
  // Earliest expiry first (Postgres puts NULLs last on ASC). FOR UPDATE serializes
  // concurrent completions competing for the same stock.
  const candidates = await tx
    .select({ id: lots.id, quantityOnHand: lots.quantityOnHand })
    .from(lots)
    .where(and(eq(lots.itemId, componentItemId), gt(lots.quantityOnHand, "0")))
    .orderBy(asc(lots.expiresAt))
    .for("update")

  const allocations: Allocation[] = []
  let remaining = quantityRequired

  for (const lot of candidates) {
    if (compareQty(remaining, "0") <= 0) break
    const take = minQty(remaining, lot.quantityOnHand)
    if (compareQty(take, "0") <= 0) continue
    allocations.push({ lotId: lot.id, quantity: take })
    remaining = subtractQty(remaining, take)
  }

  if (compareQty(remaining, "0") > 0) {
    throw new Error(`Insufficient stock for item ${componentItemId}: short by ${remaining}`)
  }
  return allocations
}

// Capacity check: don't exceed a work center's per-day capacity for a scheduled day.
export async function checkCapacity(
  tx: Tx,
  workCenterId: string | null,
  scheduledFor: string | null,
  quantityPlanned: string,
): Promise<CapacityResult> {
  if (!workCenterId || !scheduledFor) return { ok: true } // capacity only enforced when both are set

  const [wc] = await tx.select().from(workCenters).where(eq(workCenters.id, workCenterId))
  if (!wc) return { ok: true }

  const [row] = await tx
    .select({ load: sql<string>`coalesce(sum(${workOrders.quantityPlanned}), 0)` })
    .from(workOrders)
    .where(and(
      eq(workOrders.workCenterId, workCenterId),
      eq(workOrders.scheduledFor, scheduledFor),
      eq(workOrders.status, "released"),
    ))

  const scheduledLoad = row?.load ?? "0"
  const projected = addQty(scheduledLoad, quantityPlanned)
  if (compareQty(projected, wc.capacityPerDay) > 0) {
    return { ok: false, capacityPerDay: wc.capacityPerDay, scheduledLoad, requested: quantityPlanned }
  }
  return { ok: true }
}
