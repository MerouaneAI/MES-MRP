import { sql } from "drizzle-orm"
import { db } from "@/db"
import { redis } from "@/lib/redis"

export const dynamic = "force-dynamic"

export async function GET() {
  const checks: Record<string, "ok" | "fail"> = { db: "fail", redis: "fail" }
  try { await db.execute(sql`select 1`); checks.db = "ok" } catch {}
  try { if ((await redis.ping()) === "PONG") checks.redis = "ok" } catch {}

  const healthy = checks.db === "ok" && checks.redis === "ok"
  return Response.json(
    { status: healthy ? "ok" : "degraded", checks },
    { status: healthy ? 200 : 503 },
  )
}