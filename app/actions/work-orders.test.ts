import "dotenv/config"
import { describe, it, expect, vi, afterEach } from "vitest"

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({ redirect: vi.fn() }))
vi.mock("@/lib/authz", () => ({
  authorize: vi.fn(async () => ({ ok: true, user: { id: "00000000-0000-0000-0000-000000000099", email: "t@t.com", role: "admin" } })),
}))
vi.mock("@/lib/shopfloor", () => ({ publishShopFloorEvent: vi.fn() })) // no Redis needed

import { releaseWorkOrder, completeWorkOrder } from "@/app/actions/work-orders"
import { db } from "@/db"
import { items, lots, lotGenealogy } from "@/db/schema/inventory"
import { boms, bomLines, workOrders, workOrderMaterials } from "@/db/schema/production"
import { eq } from "drizzle-orm"
import { FACILITY_ID } from "@/lib/constants"

let productId = "", compId = "", bomId = "", earlyLotId = "", lateLotId = "", woId = ""

async function setup(compStock: [string, string]) {
  const t = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`
  const [comp] = await db.insert(items).values({ facilityId: FACILITY_ID, kind: "raw_material", sku: `WO-COMP-${t}`, name: "WO Comp", unit: "kg" }).returning()
  compId = comp.id
  const [product] = await db.insert(items).values({ facilityId: FACILITY_ID, kind: "finished_good", sku: `WO-FG-${t}`, name: "WO FG", unit: "unit", shelfLifeDays: 100 }).returning()
  productId = product.id
  const [bom] = await db.insert(boms).values({ facilityId: FACILITY_ID, productItemId: productId, version: 1, status: "active" }).returning()
  bomId = bom.id
  await db.insert(bomLines).values({ bomId, componentItemId: compId, quantityPer: "2.0000" }) // 2 kg per unit
  const [early] = await db.insert(lots).values({ itemId: compId, lotNumber: `E-${t}`, quantityOnHand: compStock[0], expiresAt: "2026-01-01" }).returning()
  const [late] = await db.insert(lots).values({ itemId: compId, lotNumber: `L-${t}`, quantityOnHand: compStock[1], expiresAt: "2027-01-01" }).returning()
  earlyLotId = early.id; lateLotId = late.id
  const [wo] = await db.insert(workOrders).values({ facilityId: FACILITY_ID, productItemId: productId, bomId, quantityPlanned: "10.000", status: "planned" }).returning()
  woId = wo.id
}

afterEach(async () => {
  const outputs = await db.select().from(lots).where(eq(lots.itemId, productId))
  for (const o of outputs) await db.delete(lotGenealogy).where(eq(lotGenealogy.outputLotId, o.id))
  await db.delete(workOrderMaterials).where(eq(workOrderMaterials.workOrderId, woId))
  await db.delete(workOrders).where(eq(workOrders.id, woId))
  await db.delete(lots).where(eq(lots.itemId, compId))
  await db.delete(lots).where(eq(lots.itemId, productId))
  await db.delete(bomLines).where(eq(bomLines.bomId, bomId))
  await db.delete(boms).where(eq(boms.id, bomId))
  await db.delete(items).where(eq(items.id, compId))
  await db.delete(items).where(eq(items.id, productId))
})

describe("completeWorkOrder", () => {
  it("consumes FEFO, makes one output lot, writes genealogy, and is idempotent", async () => {
    await setup(["10.000", "100.000"]) // needs 20 kg for 10 units -> 10 early + 10 late
    await releaseWorkOrder(woId, null, new FormData())
    const first = await completeWorkOrder(woId, null, new FormData())
    expect(first).toEqual({ ok: true })

    const outputs = await db.select().from(lots).where(eq(lots.itemId, productId))
    expect(outputs).toHaveLength(1)
    expect(outputs[0].quantityOnHand).toBe("10.000")

    const gen = await db.select().from(lotGenealogy).where(eq(lotGenealogy.outputLotId, outputs[0].id))
    expect(gen).toHaveLength(2) // output <- early + late

    const [early] = await db.select().from(lots).where(eq(lots.id, earlyLotId))
    const [late] = await db.select().from(lots).where(eq(lots.id, lateLotId))
    expect(early.quantityOnHand).toBe("0.000")   // drained first (FEFO)
    expect(late.quantityOnHand).toBe("90.000")   // 100 - 10

    const [wo] = await db.select().from(workOrders).where(eq(workOrders.id, woId))
    expect(wo.status).toBe("completed")
    expect(wo.quantityProduced).toBe("10.000")

    // idempotent: a second complete changes nothing
    await completeWorkOrder(woId, null, new FormData())
    const outputs2 = await db.select().from(lots).where(eq(lots.itemId, productId))
    expect(outputs2).toHaveLength(1)
    const gen2 = await db.select().from(lotGenealogy).where(eq(lotGenealogy.outputLotId, outputs[0].id))
    expect(gen2).toHaveLength(2)
  })

  it("rolls back fully if stock disappears after release", async () => {
    await setup(["10.000", "100.000"])
    await releaseWorkOrder(woId, null, new FormData())

    // Simulate stock vanishing between release and completion.
    await db.update(lots).set({ quantityOnHand: "0.000" }).where(eq(lots.id, earlyLotId))
    await db.update(lots).set({ quantityOnHand: "1.000" }).where(eq(lots.id, lateLotId))

    const res = await completeWorkOrder(woId, null, new FormData())
    expect(res).toMatchObject({ ok: false })

    const outputs = await db.select().from(lots).where(eq(lots.itemId, productId))
    expect(outputs).toHaveLength(0)                       // no output lot
    const [wo] = await db.select().from(workOrders).where(eq(workOrders.id, woId))
    expect(wo.status).toBe("released")                    // status rolled back
    const [late] = await db.select().from(lots).where(eq(lots.id, lateLotId))
    expect(late.quantityOnHand).toBe("1.000")            // stock untouched
  })
})
