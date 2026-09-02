import "dotenv/config"
import { eq } from "drizzle-orm"
import { db } from "./index"
import { items, lots } from "./schema/inventory"
import { boms, bomLines, workCenters } from "./schema/production"
import { FACILITY_ID } from "../lib/constants"

async function main() {
  // Strawberry raw material + lot (so the demo BOM has 2 components). Idempotent by SKU.
  let [straw] = await db.select().from(items).where(eq(items.sku, "RM-STRAW"))
  if (!straw) {
    ;[straw] = await db.insert(items).values({
      facilityId: FACILITY_ID, kind: "raw_material", sku: "RM-STRAW",
      name: "Strawberry Pulp", unit: "kg", shelfLifeDays: 200,
    }).returning()
    await db.insert(lots).values({
      itemId: straw.id, lotNumber: "STRAW-2026-001",
      quantityOnHand: "500.000", producedAt: "2026-07-01", expiresAt: "2027-01-01",
    })
  }

  const [sugar] = await db.select().from(items).where(eq(items.sku, "RM-SUGAR"))
  const [jam] = await db.select().from(items).where(eq(items.sku, "FG-JAM-500"))
  if (!sugar || !jam) throw new Error("Run the Phase 1 seed first (RM-SUGAR + FG-JAM-500 missing).")

  // Work center (idempotent by name).
  const existingWc = await db.select().from(workCenters).where(eq(workCenters.name, "Jam Line 1"))
  if (existingWc.length === 0) {
    await db.insert(workCenters).values({
      facilityId: FACILITY_ID, name: "Jam Line 1", capacityPerDay: "1000.000",
    })
  }

  // Active BOM v1 for the jam: 0.25 kg sugar + 0.30 kg strawberry per jar.
  const existingBom = await db.select().from(boms).where(eq(boms.productItemId, jam.id))
  if (existingBom.length === 0) {
    const [bom] = await db.insert(boms).values({
      facilityId: FACILITY_ID, productItemId: jam.id, version: 1,
      status: "active", notes: "Initial recipe",
    }).returning()
    await db.insert(bomLines).values([
      { bomId: bom.id, componentItemId: sugar.id, quantityPer: "0.2500" },
      { bomId: bom.id, componentItemId: straw.id, quantityPer: "0.3000" },
    ])
  }

  console.log("Phase 4 seed complete: work center, strawberry lot, active BOM v1")
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
