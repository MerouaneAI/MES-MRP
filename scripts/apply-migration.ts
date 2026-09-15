import "dotenv/config"
import pg from "pg"
import fs from "fs"
import path from "path"

async function main() {
  const c = new pg.Client(process.env.DATABASE_URL)
  await c.connect()
  
  const sqlPath = path.join(__dirname, "..", "drizzle", "0005_dynamic_rbac.sql")
  const sql = fs.readFileSync(sqlPath, "utf8")
  
  // Split by the Drizzle statement breakpoint marker and run each statement
  const statements = sql.split("--> statement-breakpoint").map(s => s.trim()).filter(Boolean)
  
  for (const stmt of statements) {
    try {
      console.log("Running:", stmt.slice(0, 60) + "...")
      await c.query(stmt)
      console.log("  ✓ OK")
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string }
      console.error("  ✗ Error:", err.message)
      // If table already exists, continue
      if (err.code === "42P07" || err.code === "42710") {
        console.log("  (already exists, continuing)")
        continue
      }
      throw e
    }
  }
  
  // Verify
  const r = await c.query("SELECT * FROM roles")
  console.log("\nRoles:", JSON.stringify(r.rows, null, 2))
  
  await c.end()
}
main()
