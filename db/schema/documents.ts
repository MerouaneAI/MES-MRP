import { pgTable, uuid, text, timestamp, pgEnum, index } from "drizzle-orm/pg-core"

export const documentKindEnum = pgEnum("document_kind", ["po_pdf", "coa_pdf"])
export const documentStatusEnum = pgEnum("document_status", ["queued", "processing", "done", "failed"])

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  facilityId: uuid("facility_id").notNull(),
  kind: documentKindEnum("kind").notNull(),
  refId: uuid("ref_id").notNull(),          // the PO id or lot id this document is for
  status: documentStatusEnum("status").notNull().default("queued"),
  filePath: text("file_path"),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, (t) => ({
  refIdx: index("documents_ref_idx").on(t.refId),
}))
