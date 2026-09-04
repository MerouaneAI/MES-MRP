import "dotenv/config"
import { describe, it, expect, vi } from "vitest"

// Mock Next runtime + auth BEFORE importing the actions.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({ redirect: vi.fn() }))
vi.mock("@/lib/authz", () => ({
  authorize: vi.fn(async () => ({ ok: true, user: { id: "test", email: "t@t.com", role: "admin" } })),
}))

import { createParty, deleteParty } from "@/app/actions/parties"
import { authorize } from "@/lib/authz"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { parties } from "@/db/schema/parties"
import { eq } from "drizzle-orm"

function fd(obj: Record<string, string>) {
  const f = new FormData()
  for (const [k, v] of Object.entries(obj)) f.append(k, v)
  return f
}

describe("createParty", () => {
  it("rejects a blank name (no DB write)", async () => {
    const res = await createParty(null, fd({ type: "supplier", name: "  " }))
    expect(res).toMatchObject({ ok: false })
  })

  it("returns Unauthorized when there is no session", async () => {
    vi.mocked(authorize).mockResolvedValueOnce({ ok: false, error: "Unauthorized" })
    const res = await createParty(null, fd({ type: "supplier", name: "Nope Co" }))
    expect(res).toEqual({ ok: false, error: "Unauthorized" })
  })

  it("inserts a valid party and redirects to the list", async () => {
    const name = `Test Supplier ${Date.now()}`
    await createParty(null, fd({ type: "supplier", name, phone: "+213-555-111-222" }))

    const [row] = await db.select().from(parties).where(eq(parties.name, name))
    expect(row?.name).toBe(name)
    expect(row?.type).toBe("supplier")
    expect(redirect).toHaveBeenCalledWith("/parties")

    await deleteParty(fd({ id: row.id })) // cleanup so the test is repeatable
  })
})
