import "dotenv/config"
import { describe, it, expect, vi } from "vitest"

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({ redirect: vi.fn() }))
vi.mock("@/auth", () => ({ auth: vi.fn(async () => ({ user: { id: "test", role: "admin" } })) }))

import { createItem } from "@/app/actions/items"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { items } from "@/db/schema/inventory"
import { eq } from "drizzle-orm"

function fd(obj: Record<string, string>) {
  const f = new FormData()
  for (const [k, v] of Object.entries(obj)) f.append(k, v)
  return f
}

describe("createItem", () => {
  it("rejects a blank SKU", async () => {
    const res = await createItem(null, fd({ kind: "raw_material", sku: "", name: "X", unit: "kg" }))
    expect(res).toMatchObject({ ok: false })
  })

  it("rejects when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as any)
    const res = await createItem(null, fd({ kind: "raw_material", sku: "RM-X", name: "X", unit: "kg" }))
    expect(res).toEqual({ ok: false, error: "Unauthorized" })
  })

  it("inserts a valid item and redirects", async () => {
    const sku = `RM-TEST-${Date.now()}`
    await createItem(null, fd({ kind: "raw_material", sku, name: "Test Material", unit: "kg", shelfLifeDays: "180" }))
    const [row] = await db.select().from(items).where(eq(items.sku, sku))
    expect(row?.name).toBe("Test Material")
    expect(redirect).toHaveBeenCalledWith("/items")
    await db.delete(items).where(eq(items.id, row.id)) // cleanup
  })
})