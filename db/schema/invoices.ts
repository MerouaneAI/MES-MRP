import {
  pgTable, uuid, text, integer, numeric, timestamp, primaryKey, index, uniqueIndex, pgEnum,
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

export const invoiceStatusEnum = pgEnum("invoice_status", ["draft", "issued", "delivered", "returned"])

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  facilityId: uuid("facility_id").notNull(),
  partyId: uuid("party_id").notNull().references(() => parties.id),
  fiscalYear: integer("fiscal_year").notNull(),
  sequence: integer("sequence").notNull(),
  invoiceNo: text("invoice_no").notNull(),
  currency: text("currency").notNull().default("DZD"),
  totalAmount: numeric("total_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  status: invoiceStatusEnum("status").notNull().default("draft"),
  issuedAt: timestamp("issued_at", { withTimezone: true }).defaultNow().notNull(),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  returnedAt: timestamp("returned_at", { withTimezone: true }),
}, (t) => ({
  facilityYearIdx: index("invoices_facility_year_idx").on(t.facilityId, t.fiscalYear),
  invoiceNoUnique: uniqueIndex("invoices_no_unique").on(t.facilityId, t.invoiceNo),
}))

export const invoiceLines = pgTable("invoice_lines", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  itemId: uuid("item_id").notNull(), 
  lotId: uuid("lot_id"), // assigned at delivery
  description: text("description"),
  quantity: numeric("quantity", { precision: 14, scale: 3 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 14, scale: 2 }).notNull(),
  lineTotal: numeric("line_total", { precision: 14, scale: 2 }).notNull(),
})