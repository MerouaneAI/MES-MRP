import bcrypt from "bcryptjs"
import { db } from "@/db"
import { users } from "@/db/schema/auth"
import { parties } from "@/db/schema/parties"
import { invoiceCounters } from "@/db/schema/invoices"
import { items, lots } from "@/db/schema/inventory"
import { purchaseOrders, purchaseOrderLines } from "@/db/schema/purchases"

// single factory → one constant facility id everywhere
const FACILITY_ID = "00000000-0000-0000-0000-000000000001"

async function main() {
  // 1) Admin user (idempotent thanks to unique email)
  const passwordHash = await bcrypt.hash("ChangeMe123!", 10)
  await db.insert(users).values({
    name: "Admin", email: "admin@factory.local", passwordHash, role: "admin",
  }).onConflictDoNothing({ target: users.email })

  // 2) Parties
  const [supplier] = await db.insert(parties).values({
    facilityId: FACILITY_ID, type: "supplier", name: "Resine Import EURL",
  }).returning()
  await db.insert(parties).values({
    facilityId: FACILITY_ID, type: "customer", name: "Acme Foods SARL", phone: "+213-555-000-000",
  })

  // 3) Invoice counter for the current fiscal year (REQUIRED before any invoice)
  const fiscalYear = new Date().getFullYear()
  await db.insert(invoiceCounters).values({
    facilityId: FACILITY_ID, fiscalYear, lastNumber: 0,
  }).onConflictDoNothing()

  // 4) Items (catalog, no quantity)
  const [rawItem] = await db.insert(items).values({
    facilityId: FACILITY_ID, kind: "raw_material", sku: "RM-SUGAR", name: "Refined Sugar", unit: "kg", shelfLifeDays: 365,
  }).returning()
  const [finishedItem] = await db.insert(items).values({
    facilityId: FACILITY_ID, kind: "finished_good", sku: "FG-JAM-500", name: "Strawberry Jam 500g", unit: "unit", shelfLifeDays: 540,
  }).returning()

  // 5) Lots (quantity + expiry live here)
  await db.insert(lots).values([
    { itemId: rawItem.id, lotNumber: "SUGAR-2026-001", quantityOnHand: "1000.000", producedAt: "2026-01-10", expiresAt: "2027-01-10" },
    { itemId: finishedItem.id, lotNumber: "JAM-2026-001", quantityOnHand: "240.000", producedAt: "2026-08-01", expiresAt: "2028-02-01" },
  ])

  // 6) A sample purchase order + line
  const [po] = await db.insert(purchaseOrders).values({
    facilityId: FACILITY_ID, supplierId: supplier.id, status: "ordered", totalAmount: "150000.00",
  }).returning()
  await db.insert(purchaseOrderLines).values({
    poId: po.id, itemId: rawItem.id, description: "Refined Sugar",
    quantity: "1000.000", unitPrice: "150.00", lineTotal: "150000.00",
  })

  console.log("✅ Seed complete: users, parties, counter, items, lots, PO")
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })