import {
  pgTable, uuid, text, integer, numeric, timestamp, date, pgEnum, index, uniqueIndex,
} from "drizzle-orm/pg-core"
import { items, lots } from "./inventory"

// ---------------- BOM + versioning ----------------
export const bomStatusEnum = pgEnum("bom_status", ["draft", "active", "archived"])

export const boms = pgTable("boms", {
  id: uuid("id").defaultRandom().primaryKey(),
  facilityId: uuid("facility_id").notNull(),
  productItemId: uuid("product_item_id").notNull().references(() => items.id),
  version: integer("version").notNull(),
  status: bomStatusEnum("status").notNull().default("draft"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  productVersionUnique: uniqueIndex("boms_product_version_unique").on(t.productItemId, t.version),
  productIdx: index("boms_product_idx").on(t.productItemId),
}))

export const bomLines = pgTable("bom_lines", {
  id: uuid("id").defaultRandom().primaryKey(),
  bomId: uuid("bom_id").notNull().references(() => boms.id, { onDelete: "cascade" }),
  componentItemId: uuid("component_item_id").notNull().references(() => items.id),
  quantityPer: numeric("quantity_per", { precision: 14, scale: 4 }).notNull(), // per 1 unit of output
}, (t) => ({
  bomIdx: index("bom_lines_bom_idx").on(t.bomId),
}))

// ---------------- Engineering Change Orders ----------------
export const ecoStatusEnum = pgEnum("eco_status", ["draft", "applied", "cancelled"])

export const engineeringChangeOrders = pgTable("engineering_change_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  facilityId: uuid("facility_id").notNull(),
  productItemId: uuid("product_item_id").notNull().references(() => items.id),
  fromBomId: uuid("from_bom_id").references(() => boms.id),      // null for the first recipe
  toBomId: uuid("to_bom_id").notNull().references(() => boms.id),
  reason: text("reason").notNull(),
  status: ecoStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  appliedAt: timestamp("applied_at", { withTimezone: true }),
})

// ---------------- Work centers (capacity) ----------------
export const workCenters = pgTable("work_centers", {
  id: uuid("id").defaultRandom().primaryKey(),
  facilityId: uuid("facility_id").notNull(),
  name: text("name").notNull(),
  capacityPerDay: numeric("capacity_per_day", { precision: 14, scale: 3 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

// ---------------- Work orders ----------------
export const workOrderStatusEnum = pgEnum("work_order_status", [
  "planned", "released", "completed", "cancelled",
])

export const workOrders = pgTable("work_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  facilityId: uuid("facility_id").notNull(),
  productItemId: uuid("product_item_id").notNull().references(() => items.id),
  bomId: uuid("bom_id").notNull().references(() => boms.id),   // snapshot of the version used
  workCenterId: uuid("work_center_id").references(() => workCenters.id),
  quantityPlanned: numeric("quantity_planned", { precision: 14, scale: 3 }).notNull(),
  quantityProduced: numeric("quantity_produced", { precision: 14, scale: 3 }).notNull().default("0"),
  status: workOrderStatusEnum("status").notNull().default("planned"),
  outputLotId: uuid("output_lot_id").references(() => lots.id),
  scheduledFor: date("scheduled_for"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, (t) => ({
  statusIdx: index("work_orders_status_idx").on(t.status),
  scheduleIdx: index("work_orders_schedule_idx").on(t.workCenterId, t.scheduledFor),
}))

// The MRP explosion result, snapshotted at release time.
export const workOrderMaterials = pgTable("work_order_materials", {
  id: uuid("id").defaultRandom().primaryKey(),
  workOrderId: uuid("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
  componentItemId: uuid("component_item_id").notNull().references(() => items.id),
  quantityRequired: numeric("quantity_required", { precision: 14, scale: 3 }).notNull(),
}, (t) => ({
  woIdx: index("wo_materials_wo_idx").on(t.workOrderId),
}))
