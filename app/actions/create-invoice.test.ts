import { describe, it, expect, beforeAll } from "vitest"
import "dotenv/config"
import { db } from "@/db"
import { invoiceCounters, invoices } from "@/db/schema/invoices"
import { parties } from "@/db/schema/parties"
import { createInvoice } from "@/app/actions/create-invoice"
import { eq, and } from "drizzle-orm"

const FACILITY_ID = "00000000-0000-0000-0000-000000000001"
const FISCAL_YEAR = new Date().getFullYear()

describe("gapless invoice numbering", () => {
  let partyId: string

  beforeAll(async () => {
    // Grab any seeded party to use as the invoice recipient
    const [party] = await db.select().from(parties).limit(1)
    partyId = party.id

    // Clean up any previous test invoices so sequences start fresh
    await db.delete(invoices).where(
      and(eq(invoices.facilityId, FACILITY_ID), eq(invoices.fiscalYear, FISCAL_YEAR))
    )
    await db.delete(invoiceCounters).where(
      and(eq(invoiceCounters.facilityId, FACILITY_ID), eq(invoiceCounters.fiscalYear, FISCAL_YEAR))
    )
  })

  it("50 concurrent invoices produce gapless sequences 1..50", async () => {
    // Fire 50 invoice creations in parallel — this is the stress test.
    // If the locking is broken, we'd see duplicates or gaps.
    const results = await Promise.all(
      Array.from({ length: 50 }, () =>
        createInvoice({
          facilityId: FACILITY_ID,
          partyId,
          totalAmount: "100.00",
        })
      )
    )

    // Extract and sort the sequence numbers
    const seqs = results.map((r) => r.sequence).sort((a, b) => a - b)

    // Must be exactly [1, 2, 3, ..., 50] — no gaps, no duplicates
    expect(seqs).toEqual(Array.from({ length: 50 }, (_, i) => i + 1))

    // Verify invoice numbers follow the format YYYY/000001
    const invoiceNos = results
      .map((r) => r.invoiceNo)
      .sort()
    expect(invoiceNos[0]).toBe(`${FISCAL_YEAR}/000001`)
    expect(invoiceNos[49]).toBe(`${FISCAL_YEAR}/000050`)
  }, 30_000) // generous timeout for 50 serialized DB transactions
})
