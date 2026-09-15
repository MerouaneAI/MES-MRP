import "dotenv/config"
import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { db } from "../db"
import { users, roles } from "../db/schema/auth"

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD ?? ""
  if (!email || password.length < 10) {
    throw new Error("Set ADMIN_EMAIL and a strong ADMIN_PASSWORD (>= 10 chars).")
  }
  const passwordHash = await bcrypt.hash(password, 10)
  const [adminRole] = await db.select().from(roles).where(eq(roles.name, "admin"))
  if (!adminRole) throw new Error("Admin role not found")

  const [existing] = await db.select().from(users).where(eq(users.email, email))
  if (existing) {
    await db.update(users).set({ passwordHash, roleId: adminRole.id, isActive: true }).where(eq(users.id, existing.id))
    console.log(`Updated existing admin ${email}`)
  } else {
    await db.insert(users).values({ name: "Administrator", email, passwordHash, roleId: adminRole.id })
    console.log(`Created admin ${email}`)
  }
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })