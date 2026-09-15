"use server"

import { eq } from "drizzle-orm"
import { authorize } from "@/lib/authz"
import { db } from "@/db"
import { items, lots } from "@/db/schema/inventory"
import type { ScanResult } from "@/lib/types"

export async function scanBarcode(_prev: ScanResult | null, formData: FormData): Promise<ScanResult> {
  const gate = await authorize("shopfloor", "write")
  if (!gate.ok) return { ok: false, error: gate.error }

  const code = String(formData.get("code") ?? "").trim()
  if (!code) return { ok: false, error: "Scan or type a code." }

  // 1) Try a lot number first (what's physically printed on the pallet label).
  const [lot] = await db
    .select({ lotNumber: lots.lotNumber, qty: lots.quantityOnHand, expiresAt: lots.expiresAt, itemName: items.name, unit: items.unit })
    .from(lots)
    .innerJoin(items, eq(lots.itemId, items.id))
    .where(eq(lots.lotNumber, code))
  if (lot) {
    return {
      ok: true, kind: "lot",
      title: `${lot.itemName} — lot ${lot.lotNumber}`,
      detail: `On hand: ${lot.qty} ${lot.unit}${lot.expiresAt ? ` · expires ${lot.expiresAt}` : ""}`,
    }
  }

  // 2) Fall back to an item SKU.
  const [item] = await db
    .select({ name: items.name, sku: items.sku, kind: items.kind, unit: items.unit })
    .from(items)
    .where(eq(items.sku, code))
  if (item) {
    return { ok: true, kind: "item", title: `${item.name} (${item.sku})`, detail: `Type: ${item.kind} · unit: ${item.unit}` }
  }

  return { ok: false, error: `No lot or item found for "${code}".` }
}
