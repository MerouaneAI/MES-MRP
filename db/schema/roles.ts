import {
  pgTable, uuid, text, boolean, timestamp, jsonb, uniqueIndex,
} from "drizzle-orm/pg-core"

// ─── Roles ───────────────────────────────────────────────
export const roles = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  isBuiltin: boolean("is_builtin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

// ─── Role Permissions (one row per role×page) ────────────
export const rolePermissions = pgTable("role_permissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  page: text("page").notNull(),           // PageKey value
  canView: boolean("can_view").notNull().default(false),
  canWrite: boolean("can_write").notNull().default(false),
  canDelete: boolean("can_delete").notNull().default(false),
  dataFilter: jsonb("data_filter"),       // e.g. { "partyType": ["customer"] }
}, (t) => ({
  rolePageUnique: uniqueIndex("role_permissions_role_page_idx").on(t.roleId, t.page),
}))
