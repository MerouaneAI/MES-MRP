import {
  pgTable, uuid, text, integer, numeric, timestamp, primaryKey, index, uniqueIndex,
} from "drizzle-orm/pg-core"
import { parties } from "./parties"

// One counter row per (facility, fiscal year) → guarantees gapless numbering
export const invoiceCounters = pgTable("invoice_counters", {
  facilityId: uuid("facility_id").notNull(),
  fiscalYear: integer("fiscal_year").notNull(),
  lastNumber: integer("last_number").notNull().default(0),
}, (t) => ({
  pk: primaryKey({ columns: [t.facilityId, t.fiscalYear] }), // <-- the fix
}))

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  facilityId: uuid("facility_id").notNull(),
  partyId: uuid("party_id").notNull().references(() => parties.id),
  fiscalYear: integer("fiscal_year").notNull(),
  sequence: integer("sequence").notNull(),
  invoiceNo: text("invoice_no").notNull(),
  currency: text("currency").notNull().default("DZD"),
  totalAmount: numeric("total_amount", { precision: 14, scale: 2 }).notNull(),
  issuedAt: timestamp("issued_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  facilityYearIdx: index("invoices_facility_year_idx").on(t.facilityId, t.fiscalYear),
  invoiceNoUnique: uniqueIndex("invoices_no_unique").on(t.facilityId, t.invoiceNo),
}))