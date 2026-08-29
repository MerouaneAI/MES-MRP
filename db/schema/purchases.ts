import { pgTable, uuid, text, numeric, timestamp, pgEnum } from "drizzle-orm/pg-core"
import { parties } from "./parties"

export const poStatusEnum = pgEnum("po_status", ["draft", "ordered", "received"])

export const purchaseOrders = pgTable("purchase_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  facilityId: uuid("facility_id").notNull(),
  supplierId: uuid("supplier_id").notNull().references(() => parties.id),
  status: poStatusEnum("status").notNull().default("draft"),
  currency: text("currency").notNull().default("DZD"),
  totalAmount: numeric("total_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  expectedAt: timestamp("expected_at", { withTimezone: true }),
  receivedAt: timestamp("received_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

export const purchaseOrderLines = pgTable("purchase_order_lines", {
  id: uuid("id").defaultRandom().primaryKey(),
  poId: uuid("po_id").notNull().references(() => purchaseOrders.id, { onDelete: "cascade" }),
  itemId: uuid("item_id").notNull(), // logical FK to items.id (kept loose to avoid a circular import)
  description: text("description"),
  quantity: numeric("quantity", { precision: 14, scale: 3 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 14, scale: 2 }).notNull(),
  lineTotal: numeric("line_total", { precision: 14, scale: 2 }).notNull(),
})