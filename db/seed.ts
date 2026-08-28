import bcrypt from "bcryptjs"
import { db } from "@/db"
import { users } from "@/db/schema/auth"

async function main() {
  const passwordHash = await bcrypt.hash("ChangeMe123!", 10)
  await db.insert(users).values({
    name: "Admin",
    email: "admin@factory.local",
    passwordHash,
    role: "admin",
  })
  console.log("Seeded admin user")
}
main()