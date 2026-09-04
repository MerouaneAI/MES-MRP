import { pgTable, uuid, text, timestamp, jsonb, index } from "drizzle-orm/pg-core"

// Append-only trail: who did what, when. Never updated or deleted from the app.
export const auditLog = pgTable("audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  facilityId: uuid("facility_id").notNull(),
  userId: uuid("user_id"),            // null for system / background jobs
  userEmail: text("user_email"),      // snapshot, survives user deletion
  action: text("action").notNull(),   // e.g. "invoice.create", "work_order.complete"
  entity: text("entity").notNull(),   // e.g. "invoice", "work_order", "user"
  entityId: text("entity_id"),        // affected row id (text: not always a uuid)
  summary: text("summary"),           // human-readable one-liner
  metadata: jsonb("metadata"),        // optional structured detail
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  entityIdx: index("audit_entity_idx").on(t.entity, t.entityId),
  userIdx: index("audit_user_idx").on(t.userId),
  createdIdx: index("audit_created_idx").on(t.createdAt),
}))