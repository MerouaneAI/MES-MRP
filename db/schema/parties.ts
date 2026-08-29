import { pgTable, uuid, text, timestamp, pgEnum, index } from "drizzle-orm/pg-core"

export const partyTypeEnum = pgEnum("party_type", ["customer", "supplier", "both"])

export const parties = pgTable("parties", {
    id: uuid("id").defaultRandom().primaryKey(),
    facilityId: uuid("facility_id").notNull(),
    type: partyTypeEnum("type").notNull().default("customer"),
    name: text("name").notNull(),
    // Algerian legal identifiers — optional, unvalidated, reserved for later
    nif: text("nif"),
    nis: text("nis"),
    rc: text("rc"),
    ai: text("ai"),
    phone: text("phone"),
    address: text("address"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
    facilityIdx: index("parties_facility_idx").on(t.facilityId),
}))