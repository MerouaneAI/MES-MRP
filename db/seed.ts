import bcrypt from "bcryptjs"
import { eq, sql } from "drizzle-orm"
import { db } from "@/db"
import { users, roles } from "@/db/schema/auth"
import { parties } from "@/db/schema/parties"
import { invoiceCounters, invoices, invoiceLines } from "@/db/schema/invoices"
import { items, lots } from "@/db/schema/inventory"
import { purchaseOrders, purchaseOrderLines } from "@/db/schema/purchases"
import { boms, bomLines, workCenters, workOrders, workOrderMaterials } from "@/db/schema/production"

// single factory → one constant facility id everywhere
const FACILITY_ID = "00000000-0000-0000-0000-000000000001"

async function main() {
  // Clear all data (except auth) to avoid unique constraint violations
  await db.execute(sql`TRUNCATE TABLE invoices, invoice_lines, work_order_materials, work_orders, bom_lines, boms, purchase_order_lines, purchase_orders, lots, items, invoice_counters, parties, work_centers CASCADE;`)
  
  const [adminRole] = await db.select().from(roles).where(eq(roles.name, "admin"))
  if (!adminRole) throw new Error("Admin role not found. Run migration first.")

  // 1) Admin user
  const passwordHash = await bcrypt.hash("ChangeMe123!", 10)
  await db.insert(users).values({
    name: "Admin", email: "admin@factory.local", passwordHash, roleId: adminRole.id,
  }).onConflictDoNothing({ target: users.email })

  // 2) Parties
  const [supplier] = await db.insert(parties).values({
    facilityId: FACILITY_ID, type: "supplier", name: "Resine Import EURL",
  }).returning()
  const [supplier2] = await db.insert(parties).values({
    facilityId: FACILITY_ID, type: "supplier", name: "Global Plastics Ltd",
  }).returning()
  const [customer] = await db.insert(parties).values({
    facilityId: FACILITY_ID, type: "customer", name: "Acme Foods SARL", phone: "+213-555-000-000",
  }).returning()
  const [customer2] = await db.insert(parties).values({
    facilityId: FACILITY_ID, type: "customer", name: "HyperMarket Group", phone: "+213-555-111-222",
  }).returning()

  // 3) Invoice counter
  const fiscalYear = new Date().getFullYear()
  await db.insert(invoiceCounters).values({
    facilityId: FACILITY_ID, fiscalYear, lastNumber: 2,
  }).onConflictDoNothing()

  // 4) Items
  // Raw materials
  const [sugar] = await db.insert(items).values({
    facilityId: FACILITY_ID, kind: "raw_material", sku: "RM-SUGAR", name: "Refined Sugar", unit: "kg", shelfLifeDays: 365,
  }).onConflictDoUpdate({ target: [items.facilityId, items.sku], set: { name: "Refined Sugar" } }).returning()
  const [pectin] = await db.insert(items).values({
    facilityId: FACILITY_ID, kind: "raw_material", sku: "RM-PECTIN", name: "Apple Pectin", unit: "kg", shelfLifeDays: 730,
  }).onConflictDoUpdate({ target: [items.facilityId, items.sku], set: { name: "Apple Pectin" } }).returning()
  const [strawberries] = await db.insert(items).values({
    facilityId: FACILITY_ID, kind: "raw_material", sku: "RM-STRAWBERRY", name: "Fresh Strawberries", unit: "kg", shelfLifeDays: 14,
  }).onConflictDoUpdate({ target: [items.facilityId, items.sku], set: { name: "Fresh Strawberries" } }).returning()
  const [glassJar] = await db.insert(items).values({
    facilityId: FACILITY_ID, kind: "raw_material", sku: "PK-JAR-500", name: "Glass Jar 500ml", unit: "unit", shelfLifeDays: 3650,
  }).onConflictDoUpdate({ target: [items.facilityId, items.sku], set: { name: "Glass Jar 500ml" } }).returning()
  
  // Finished goods
  const [jam] = await db.insert(items).values({
    facilityId: FACILITY_ID, kind: "finished_good", sku: "FG-JAM-500", name: "Strawberry Jam 500g", unit: "unit", shelfLifeDays: 540,
  }).onConflictDoUpdate({ target: [items.facilityId, items.sku], set: { name: "Strawberry Jam 500g" } }).returning()
  const [marmalade] = await db.insert(items).values({
    facilityId: FACILITY_ID, kind: "finished_good", sku: "FG-MARM-500", name: "Orange Marmalade 500g", unit: "unit", shelfLifeDays: 540,
  }).onConflictDoUpdate({ target: [items.facilityId, items.sku], set: { name: "Orange Marmalade 500g" } }).returning()

  // 5) Lots
  const [sugarLot] = await db.insert(lots).values([
    { itemId: sugar.id, lotNumber: `SUGAR-${new Date().getFullYear()}-001`, quantityOnHand: "1500.000", producedAt: new Date().toISOString().split("T")[0], expiresAt: "2027-01-10" },
  ]).returning()
  const [pectinLot] = await db.insert(lots).values([
    { itemId: pectin.id, lotNumber: `PECTIN-${new Date().getFullYear()}-001`, quantityOnHand: "200.000", producedAt: new Date().toISOString().split("T")[0], expiresAt: "2028-01-10" },
  ]).returning()
  const [strawberryLot] = await db.insert(lots).values([
    { itemId: strawberries.id, lotNumber: `STRAWBERRY-${new Date().getFullYear()}-001`, quantityOnHand: "500.000", producedAt: new Date().toISOString().split("T")[0], expiresAt: "2026-10-10" },
  ]).returning()
  const [jarLot] = await db.insert(lots).values([
    { itemId: glassJar.id, lotNumber: `JAR-${new Date().getFullYear()}-001`, quantityOnHand: "10000.000", producedAt: new Date().toISOString().split("T")[0], expiresAt: "2036-01-10" },
  ]).returning()
  const [jamLot] = await db.insert(lots).values([
    { itemId: jam.id, lotNumber: `JAM-${new Date().getFullYear()}-001`, quantityOnHand: "850.000", producedAt: new Date().toISOString().split("T")[0], expiresAt: "2028-02-01" },
  ]).returning()

  // 6) Purchase Orders
  const [po1] = await db.insert(purchaseOrders).values({
    facilityId: FACILITY_ID, supplierId: supplier.id, status: "received", totalAmount: "150000.00",
  }).returning()
  await db.insert(purchaseOrderLines).values({
    poId: po1.id, itemId: sugar.id, description: "Refined Sugar",
    quantity: "1000.000", unitPrice: "150.00", lineTotal: "150000.00",
  })

  const [po2] = await db.insert(purchaseOrders).values({
    facilityId: FACILITY_ID, supplierId: supplier2.id, status: "ordered", totalAmount: "45000.00",
  }).returning()
  await db.insert(purchaseOrderLines).values({
    poId: po2.id, itemId: pectin.id, description: "Apple Pectin",
    quantity: "150.000", unitPrice: "300.00", lineTotal: "45000.00",
  })

  // 7) BOM
  const [bom] = await db.insert(boms).values({
    facilityId: FACILITY_ID, productItemId: jam.id, version: 1, status: "active", notes: "Standard Strawberry Jam Recipe",
  }).returning()
  await db.insert(bomLines).values([
    { bomId: bom.id, componentItemId: strawberries.id, quantityPer: "0.55" }, // 550g berries per jar
    { bomId: bom.id, componentItemId: sugar.id, quantityPer: "0.45" }, // 450g sugar per jar
    { bomId: bom.id, componentItemId: pectin.id, quantityPer: "0.01" }, // 10g pectin
    { bomId: bom.id, componentItemId: glassJar.id, quantityPer: "1.0" },
  ])

  // 8) Work Centers
  const [cookingCenter] = await db.insert(workCenters).values({
    facilityId: FACILITY_ID, name: "Cooking Station A", capacityPerDay: "2000.000",
  }).returning()
  const [packagingCenter] = await db.insert(workCenters).values({
    facilityId: FACILITY_ID, name: "Packaging Line 1", capacityPerDay: "5000.000",
  }).returning()

  // 9) Work Orders (Fill past 7 days for Yield Trend)
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split("T")[0]
    
    const qtyPlanned = Math.floor(Math.random() * 500) + 500
    // random yield between 85% and 100%
    const qtyProduced = Math.floor(qtyPlanned * (0.85 + Math.random() * 0.15))
    
    const [wo] = await db.insert(workOrders).values({
      facilityId: FACILITY_ID, productItemId: jam.id, bomId: bom.id, workCenterId: cookingCenter.id,
      quantityPlanned: String(qtyPlanned), quantityProduced: String(qtyProduced), status: "completed",
      scheduledFor: dateStr, completedAt: d,
    }).returning()
    await db.insert(workOrderMaterials).values([
      { workOrderId: wo.id, componentItemId: strawberries.id, quantityRequired: String(qtyPlanned * 0.55) },
      { workOrderId: wo.id, componentItemId: sugar.id, quantityRequired: String(qtyPlanned * 0.45) },
      { workOrderId: wo.id, componentItemId: pectin.id, quantityRequired: String(qtyPlanned * 0.01) },
      { workOrderId: wo.id, componentItemId: glassJar.id, quantityRequired: String(qtyPlanned) },
    ])
  }

  // Active work order
  const [woActive] = await db.insert(workOrders).values({
    facilityId: FACILITY_ID, productItemId: jam.id, bomId: bom.id, workCenterId: cookingCenter.id,
    quantityPlanned: "500.000", quantityProduced: "0.000", status: "released", scheduledFor: new Date().toISOString().split("T")[0],
  }).returning()
  await db.insert(workOrderMaterials).values([
    { workOrderId: woActive.id, componentItemId: strawberries.id, quantityRequired: "275.000" },
    { workOrderId: woActive.id, componentItemId: sugar.id, quantityRequired: "225.000" },
    { workOrderId: woActive.id, componentItemId: pectin.id, quantityRequired: "5.000" },
    { workOrderId: woActive.id, componentItemId: glassJar.id, quantityRequired: "500.000" },
  ])

  // 10) Invoices (Fill past 7 days for Sales Volume)
  let invSeq = 1
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    // 2 invoices per day to make the graph look good
    for (let j = 0; j < 2; j++) {
      const isDelivered = Math.random() > 0.4 // 60% chance to be delivered
      const amount = String(Math.floor(Math.random() * 50000) + 10000)
      const [inv] = await db.insert(invoices).values({
        facilityId: FACILITY_ID, partyId: customer.id, fiscalYear, sequence: invSeq, invoiceNo: `INV-${fiscalYear}-${String(invSeq).padStart(4, '0')}`,
        totalAmount: amount, 
        status: isDelivered ? "delivered" : "issued",
        issuedAt: d, deliveredAt: isDelivered ? d : null,
      }).returning()
      await db.insert(invoiceLines).values({
        invoiceId: inv.id, itemId: jam.id, lotId: jamLot.id, description: "Strawberry Jam 500g",
        quantity: String(Math.floor(Math.random() * 150) + 50), unitPrice: "300.00", lineTotal: amount,
      })
      invSeq++
    }
  }

  console.log("✅ Seed complete: users, parties, counters, items, lots, POs, BOMs, WorkCenters, WorkOrders, Invoices")
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })