import "dotenv/config"
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest"

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({ redirect: vi.fn() }))
vi.mock("@/auth", () => ({ auth: vi.fn() }))

import { createUser, setUserActive } from "@/app/actions/users"
import { auth } from "@/auth"
import { db } from "@/db"
import { users, roles } from "@/db/schema/auth"
import { auditLog } from "@/db/schema/audit"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

let adminId = ""
let operatorRoleId = ""
let viewerRoleId = ""
const cleanupEmails: string[] = []

function fd(obj: Record<string, string>) {
  const f = new FormData()
  for (const [k, v] of Object.entries(obj)) f.append(k, v)
  return f
}

beforeAll(async () => {
  // Look up role IDs
  const allRoles = await db.select().from(roles)
  operatorRoleId = allRoles.find(r => r.name === "operator")?.id ?? ""
  viewerRoleId = allRoles.find(r => r.name === "viewer")?.id ?? ""

  const [admin] = await db.select().from(users).where(eq(users.email, "admin@factory.local"))
  adminId = admin.id
  vi.mocked(auth).mockResolvedValue({ user: { id: adminId, email: admin.email, role: "admin" } } as unknown as Awaited<ReturnType<typeof auth>>)
})

afterAll(async () => {
  for (const email of cleanupEmails) {
    const [u] = await db.select().from(users).where(eq(users.email, email))
    if (u) {
      await db.delete(auditLog).where(eq(auditLog.entityId, u.id))
      await db.delete(users).where(eq(users.id, u.id))
    }
  }
})

describe("createUser", () => {
  it("creates a user with a hashed password and writes an audit row", async () => {
    const email = `op-${Date.now()}@factory.local`
    cleanupEmails.push(email)
    await createUser(null, fd({ name: "Op", email, roleId: operatorRoleId, password: "supersecret123" }))

    const [row] = await db.select().from(users).where(eq(users.email, email))
    expect(row?.roleId).toBe(operatorRoleId)
    expect(row.passwordHash).not.toBe("supersecret123")
    expect(await bcrypt.compare("supersecret123", row.passwordHash)).toBe(true)

    const audits = await db.select().from(auditLog).where(eq(auditLog.entityId, row.id))
    expect(audits.some((a) => a.action === "user.create")).toBe(true)
  })

  it("is blocked for non-admins", async () => {
    const opEmail = `op2-${Date.now()}@factory.local`
    cleanupEmails.push(opEmail)
    const hash = await bcrypt.hash("supersecret123", 10)
    const [op] = await db.insert(users).values({ name: "Op2", email: opEmail, roleId: operatorRoleId, passwordHash: hash }).returning()
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: op.id, email: op.email, role: "operator" } } as unknown as Awaited<ReturnType<typeof auth>>)

    const res = await createUser(null, fd({ name: "No", email: `no-${Date.now()}@factory.local`, roleId: viewerRoleId, password: "supersecret123" }))
    expect(res).toMatchObject({ ok: false })
  })
})

describe("setUserActive", () => {
  it("refuses to deactivate your own account", async () => {
    await expect(setUserActive(fd({ userId: adminId, active: "false" }))).rejects.toThrow(/your own account/i)
  })
})