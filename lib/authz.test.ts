import { describe, it, expect, vi } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/db", () => ({ db: {} })) // not used when fresh:false

import { authorize, can } from "@/lib/authz"
import { auth } from "@/auth"

describe("can()", () => {
  it("respects the role hierarchy", () => {
    expect(can("admin", "operator")).toBe(true)
    expect(can("operator", "viewer")).toBe(true)
    expect(can("operator", "admin")).toBe(false)
    expect(can("viewer", "operator")).toBe(false)
  })
})

describe("authorize() with the token role", () => {
  it("rejects when there is no session", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as unknown as Awaited<ReturnType<typeof auth>>)
    expect(await authorize("viewer")).toMatchObject({ ok: false })
  })
  it("allows when the role meets the minimum", async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "u1", email: "a@b.c", role: "operator" } } as unknown as Awaited<ReturnType<typeof auth>>)
    expect((await authorize("operator")).ok).toBe(true)
  })
  it("blocks when the role is below the minimum", async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "u1", email: "a@b.c", role: "viewer" } } as unknown as Awaited<ReturnType<typeof auth>>)
    expect(await authorize("admin")).toMatchObject({ ok: false })
  })
})