import {
  pgTable, uuid, text, numeric, timestamp, date, pgEnum, index, integer, uniqueIndex,
} from "drizzle-orm/pg-core"

export const itemKindEnum = pgEnum("item_kind", ["raw_material", "finished_good"])

// Catalog: NO quantity here
export const items = pgTable("items", {
  id: uuid("id").defaultRandom().primaryKey(),
  facilityId: uuid("facility_id").notNull(),
  kind: itemKindEnum("kind").notNull(),
  sku: text("sku").notNull(),
  name: text("name").notNull(),
  unit: text("unit").notNull().default("kg"),
  shelfLifeDays: integer("shelf_life_days"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  skuUnique: uniqueIndex("items_facility_sku_unique").on(t.facilityId, t.sku),
}))

// Lot/batch: THIS is where quantity + expiry live
export const lots = pgTable("lots", {
  id: uuid("id").defaultRandom().primaryKey(),
  itemId: uuid("item_id").notNull().references(() => items.id),
  lotNumber: text("lot_number").notNull(),
  quantityOnHand: numeric("quantity_on_hand", { precision: 14, scale: 3 }).notNull().default("0"),
  producedAt: date("produced_at"),
  expiresAt: date("expires_at"),
  sourcePoId: uuid("source_po_id"), // logical FK to purchase_orders.id
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  expiryIdx: index("lots_expiry_idx").on(t.expiresAt),
  itemLotIdx: index("lots_item_lot_idx").on(t.itemId, t.lotNumber),
}))

// Traceability: which input lots produced which output lot
export const lotGenealogy = pgTable("lot_genealogy", {
  id: uuid("id").defaultRandom().primaryKey(),
  outputLotId: uuid("output_lot_id").notNull().references(() => lots.id),
  inputLotId: uuid("input_lot_id").notNull().references(() => lots.id),
  quantityUsed: numeric("quantity_used", { precision: 14, scale: 3 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  outputIdx: index("genealogy_output_idx").on(t.outputLotId),
  inputIdx: index("genealogy_input_idx").on(t.inputLotId),
}))