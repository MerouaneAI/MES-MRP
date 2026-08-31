import "dotenv/config"
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest"

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({ redirect: vi.fn() }))
vi.mock("@/auth", () => ({ auth: vi.fn(async () => ({ user: { id: "test", role: "admin" } })) }))

import { receivePurchaseOrder } from "@/app/actions/purchasing"
import { db } from "@/db"
import { parties } from "@/db/schema/parties"
import { items, lots } from "@/db/schema/inventory"
import { purchaseOrders, purchaseOrderLines } from "@/db/schema/purchases"
import { eq } from "drizzle-orm"
import { FACILITY_ID } from "@/lib/constants"

function fd(obj: Record<string, string>) {
  const f = new FormData()
  for (const [k, v] of Object.entries(obj)) f.append(k, v)
  return f
}

let poId = ""
let itemId = ""
let supplierId = ""

beforeAll(async () => {
  const [supplier] = await db.insert(parties).values({ facilityId: FACILITY_ID, type: "supplier", name: `TestSup ${Date.now()}` }).returning()
  supplierId = supplier.id
  const [item] = await db.insert(items).values({ facilityId: FACILITY_ID, kind: "raw_material", sku: `RCV-${Date.now()}`, name: "Recv Material", unit: "kg", shelfLifeDays: 100 }).returning()
  itemId = item.id
  const [po] = await db.insert(purchaseOrders).values({ facilityId: FACILITY_ID, supplierId, status: "ordered", totalAmount: "500.00" }).returning()
  poId = po.id
  await db.insert(purchaseOrderLines).values({ poId, itemId, description: "Recv Material", quantity: "500.000", unitPrice: "1.00", lineTotal: "500.00" })
})

afterAll(async () => {
  await db.delete(lots).where(eq(lots.sourcePoId, poId))
  await db.delete(purchaseOrderLines).where(eq(purchaseOrderLines.poId, poId))
  await db.delete(purchaseOrders).where(eq(purchaseOrders.id, poId))
  await db.delete(items).where(eq(items.id, itemId))
  await db.delete(parties).where(eq(parties.id, supplierId))
})

describe("receivePurchaseOrder", () => {
  it("creates one lot per line and is idempotent on a second call", async () => {
    await receivePurchaseOrder(fd({ poId }))
    await receivePurchaseOrder(fd({ poId })) // simulate double-click / refresh

    const createdLots = await db.select().from(lots).where(eq(lots.sourcePoId, poId))
    expect(createdLots).toHaveLength(1)                 // NOT 2 -> idempotent
    expect(createdLots[0].quantityOnHand).toBe("500.000")

    const [po] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, poId))
    expect(po.status).toBe("received")
  })
})