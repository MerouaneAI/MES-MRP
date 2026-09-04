import { pgTable, uuid, text, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core"

export const userRoleEnum = pgEnum("user_role", ["admin", "operator", "viewer"])

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("operator"),
  isActive: boolean("is_active").notNull().default(true), // <-- added in Phase 5
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})