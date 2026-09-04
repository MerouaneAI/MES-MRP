import "dotenv/config"
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))

import { changeMyPassword } from "@/app/actions/account"
import { auth } from "@/auth"
import { db } from "@/db"
import { users } from "@/db/schema/auth"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

let userId = ""
const email = `acct-${Date.now()}@factory.local`

function fd(obj: Record<string, string>) {
  const f = new FormData()
  for (const [k, v] of Object.entries(obj)) f.append(k, v)
  return f
}

beforeAll(async () => {
  const hash = await bcrypt.hash("originalpass123", 10)
  const [u] = await db.insert(users).values({ name: "Acct", email, role: "viewer", passwordHash: hash }).returning()
  userId = u.id
  vi.mocked(auth).mockResolvedValue({ user: { id: userId, email, role: "viewer" } } as any)
})

afterAll(async () => { await db.delete(users).where(eq(users.id, userId)) })

describe("changeMyPassword", () => {
  it("rejects a wrong current password", async () => {
    const res = await changeMyPassword(null, fd({ currentPassword: "wrong", newPassword: "brandnewpass123" }))
    expect(res).toMatchObject({ ok: false })
  })
  it("changes the hash when the current password is correct", async () => {
    const res = await changeMyPassword(null, fd({ currentPassword: "originalpass123", newPassword: "brandnewpass123" }))
    expect(res).toEqual({ ok: true })
    const [u] = await db.select().from(users).where(eq(users.id, userId))
    expect(await bcrypt.compare("brandnewpass123", u.passwordHash)).toBe(true)
  })
})