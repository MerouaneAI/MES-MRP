import "dotenv/config"
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest"

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({ redirect: vi.fn() }))
vi.mock("@/lib/authz", () => ({
  authorize: vi.fn(async () => ({ ok: true, user: { id: "test", email: "t@t.com", role: "admin" } })),
}))

import { createInvoiceRecord } from "@/app/actions/invoices"
import { db } from "@/db"
import { parties } from "@/db/schema/parties"
import { invoices } from "@/db/schema/invoices"
import { eq } from "drizzle-orm"
import { FACILITY_ID } from "@/lib/constants"

let partyId = ""
const createdIds: string[] = []

beforeAll(async () => {
  const [c] = await db.insert(parties).values({ facilityId: FACILITY_ID, type: "customer", name: `TestCust ${Date.now()}` }).returning()
  partyId = c.id
})

afterAll(async () => {
  for (const id of createdIds) await db.delete(invoices).where(eq(invoices.id, id))
  await db.delete(parties).where(eq(parties.id, partyId))
})

describe("createInvoiceRecord", () => {
  it("produces 50 unique, consecutive numbers under parallel load", async () => {
    const results = await Promise.all(
      Array.from({ length: 50 }, () => createInvoiceRecord({ partyId, totalAmount: "100.00" })),
    )
    results.forEach((r) => createdIds.push(r.id))

    const seqs = results.map((r) => r.sequence).sort((a, b) => a - b)
    expect(new Set(seqs).size).toBe(50)                    // no duplicates
    for (let i = 1; i < seqs.length; i++) {
      expect(seqs[i]).toBe(seqs[i - 1] + 1)                // gapless / consecutive
    }
  })
})