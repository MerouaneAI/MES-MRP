import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { config } from "dotenv"

config()

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const db = drizzle(pool)
  console.log("Migrating...")
  try {
    await migrate(db, { migrationsFolder: "./drizzle" })
    console.log("Success!")
  } catch (e) {
    console.error("Migration failed:", e)
  }
  await pool.end()
}

main()
