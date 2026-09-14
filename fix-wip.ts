import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import { config } from "dotenv"

config()

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  
  console.log("Updating WIP items...")
  try {
    await pool.query(`UPDATE items SET kind = 'raw_material' WHERE kind = 'wip'`)
    console.log("Updated.")
  } catch (e) {
    console.error("Failed:", e)
  }
  await pool.end()
}

main()
