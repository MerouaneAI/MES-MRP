import { describe, it, expect, vi } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/db", () => ({ db: {} }))

import { authorize } from "@/lib/authz"
import { auth } from "@/auth"

describe("authorize()", () => {
  it("rejects when there is no session", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as unknown as Awaited<ReturnType<typeof auth>>)
    expect(await authorize("users", "view")).toMatchObject({ ok: false })
  })
})