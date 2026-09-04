import { z } from "zod"

const schema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be a long random string (>= 32 chars)"),
  STORAGE_DIR: z.string().min(1).default("./storage"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors)
  throw new Error("Invalid environment configuration — check your .env")
}

export const env = parsed.data