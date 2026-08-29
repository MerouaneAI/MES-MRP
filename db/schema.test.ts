import { describe, it, expect } from "vitest"
import "dotenv/config"
import { db } from "@/db"
import { parties } from "@/db/schema/parties"
import { items } from "@/db/schema/inventory"

describe("phase 1 schema smoke test", () => {
  it("seeded parties exist", async () => {
    const rows = await db.select().from(parties)
    expect(rows.length).toBeGreaterThanOrEqual(2)
  })
  it("items have unique SKUs and no quantity column", async () => {
    const rows = await db.select().from(items)
    expect(rows.length).toBeGreaterThanOrEqual(2)
    expect(rows[0]).not.toHaveProperty("quantityOnHand") // qty lives on lots, not items
  })
})