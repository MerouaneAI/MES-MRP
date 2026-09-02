import "dotenv/config"
import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { and, eq } from "drizzle-orm"
import { db } from "@/db"
import { items, lots } from "@/db/schema/inventory"
import { boms, bomLines, workCenters } from "@/db/schema/production"
import { FACILITY_ID } from "@/lib/constants"
import { explodeBom, allocateFefo, checkCapacity } from "@/lib/mrp"

let productId = "", compId = "", bomId = "", wcId = ""
const tag = Date.now()

beforeAll(async () => {
  const [comp] = await db.insert(items).values({ facilityId: FACILITY_ID, kind: "raw_material", sku: `MRP-COMP-${tag}`, name: "MRP Comp", unit: "kg" }).returning()
  compId = comp.id
  const [product] = await db.insert(items).values({ facilityId: FACILITY_ID, kind: "finished_good", sku: `MRP-FG-${tag}`, name: "MRP FG", unit: "unit" }).returning()
  productId = product.id
  const [bom] = await db.insert(boms).values({ facilityId: FACILITY_ID, productItemId: productId, version: 1, status: "active" }).returning()
  bomId = bom.id
  await db.insert(bomLines).values({ bomId, componentItemId: compId, quantityPer: "2.0000" })

  // Earlier-expiry lot has LESS stock; FEFO must still drain it first.
  await db.insert(lots).values([
    { itemId: compId, lotNumber: `EARLY-${tag}`, quantityOnHand: "10.000", expiresAt: "2026-01-01" },
    { itemId: compId, lotNumber: `LATE-${tag}`, quantityOnHand: "100.000", expiresAt: "2027-01-01" },
  ])

  const [wc] = await db.insert(workCenters).values({ facilityId: FACILITY_ID, name: `WC-${tag}`, capacityPerDay: "50.000" }).returning()
  wcId = wc.id
})

afterAll(async () => {
  await db.delete(bomLines).where(eq(bomLines.bomId, bomId))
  await db.delete(boms).where(eq(boms.id, bomId))
  await db.delete(lots).where(eq(lots.itemId, compId))
  await db.delete(workCenters).where(eq(workCenters.id, wcId))
  await db.delete(items).where(eq(items.id, compId))
  await db.delete(items).where(eq(items.id, productId))
})

describe("explodeBom", () => {
  it("multiplies each component by the planned quantity", async () => {
    await db.transaction(async (tx) => {
      const reqs = await explodeBom(tx, bomId, "5.000")
      expect(reqs).toHaveLength(1)
      expect(reqs[0]).toMatchObject({ componentItemId: compId, quantityRequired: "10.000" }) // 2 * 5
    })
  })
})

describe("allocateFefo", () => {
  it("takes from the earliest-expiry lot first", async () => {
    await db.transaction(async (tx) => {
      const allocs = await allocateFefo(tx, compId, "5.000")
      const [early] = await tx.select().from(lots).where(and(eq(lots.itemId, compId), eq(lots.lotNumber, `EARLY-${tag}`)))
      expect(allocs).toHaveLength(1)
      expect(allocs[0].lotId).toBe(early.id)   // earliest expiry, not the bigger lot
      expect(allocs[0].quantity).toBe("5.000")
    })
  })

  it("spans lots in FEFO order and throws when stock is insufficient", async () => {
    await db.transaction(async (tx) => {
      const allocs = await allocateFefo(tx, compId, "15.000") // 10 early + 5 late
      expect(allocs).toHaveLength(2)
      expect(allocs[0].quantity).toBe("10.000")  // drains early first
      expect(allocs[1].quantity).toBe("5.000")
    })
    await expect(
      db.transaction(async (tx) => { await allocateFefo(tx, compId, "1000.000") }),
    ).rejects.toThrow(/Insufficient stock/)
  })
})

describe("checkCapacity", () => {
  it("blocks when the requested quantity exceeds daily capacity", async () => {
    await db.transaction(async (tx) => {
      const over = await checkCapacity(tx, wcId, "2026-09-10", "60.000")  // cap 50
      const under = await checkCapacity(tx, wcId, "2026-09-10", "40.000")
      expect(over.ok).toBe(false)
      expect(under.ok).toBe(true)
    })
  })
})
