// db/seed-dashboard.ts  — Adds realistic data so the dashboard looks alive
import { db } from "@/db"
import { items, lots } from "@/db/schema/inventory"
import { boms, bomLines, workOrders } from "@/db/schema/production"
import { purchaseOrders, purchaseOrderLines } from "@/db/schema/purchases"
import { parties } from "@/db/schema/parties"
import { eq } from "drizzle-orm"

const F = "00000000-0000-0000-0000-000000000001"

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}
function dateStr(d: Date) { return d.toISOString().slice(0, 10) }

async function main() {
  // ── Extra catalog items ──
  const extraItems = [
    { facilityId: F, kind: "raw_material" as const, sku: "RM-FLOUR", name: "Wheat Flour T55", unit: "kg", shelfLifeDays: 180 },
    { facilityId: F, kind: "raw_material" as const, sku: "RM-BUTTER", name: "Unsalted Butter", unit: "kg", shelfLifeDays: 90 },
    { facilityId: F, kind: "raw_material" as const, sku: "RM-EGGS", name: "Fresh Eggs", unit: "unit", shelfLifeDays: 30 },
    { facilityId: F, kind: "raw_material" as const, sku: "RM-VANILLA", name: "Vanilla Extract", unit: "L", shelfLifeDays: 730 },
    { facilityId: F, kind: "raw_material" as const, sku: "RM-PECTIN", name: "Fruit Pectin", unit: "kg", shelfLifeDays: 365 },
    { facilityId: F, kind: "finished_good" as const, sku: "FG-CAKE-CH", name: "Chocolate Cake 1kg", unit: "unit", shelfLifeDays: 14 },
    { facilityId: F, kind: "finished_good" as const, sku: "FG-BREAD-WH", name: "White Bread Loaf", unit: "unit", shelfLifeDays: 5 },
    { facilityId: F, kind: "finished_good" as const, sku: "FG-COOKIE-VAN", name: "Vanilla Cookies 250g", unit: "unit", shelfLifeDays: 60 },
    { facilityId: F, kind: "wip" as const, sku: "WIP-DOUGH", name: "Base Dough Mix", unit: "kg", shelfLifeDays: 2 },
  ]
  const inserted = await db.insert(items).values(extraItems).onConflictDoNothing().returning()
  console.log(`  ✓ ${inserted.length} extra items inserted`)

  // Fetch all items by sku for reference
  const allItems = await db.select().from(items)
  const bySku = Object.fromEntries(allItems.map(i => [i.sku, i]))

  // ── Extra lots (inventory) ──
  const lotData = [
    { itemId: bySku["RM-FLOUR"].id, lotNumber: "FLOUR-2026-001", quantityOnHand: "2500.000", producedAt: dateStr(daysAgo(20)), expiresAt: dateStr(daysAgo(-160)) },
    { itemId: bySku["RM-FLOUR"].id, lotNumber: "FLOUR-2026-002", quantityOnHand: "1800.000", producedAt: dateStr(daysAgo(5)), expiresAt: dateStr(daysAgo(-175)) },
    { itemId: bySku["RM-BUTTER"].id, lotNumber: "BUTTER-2026-001", quantityOnHand: "300.000", producedAt: dateStr(daysAgo(10)), expiresAt: dateStr(daysAgo(-80)) },
    { itemId: bySku["RM-EGGS"].id, lotNumber: "EGGS-2026-001", quantityOnHand: "500.000", producedAt: dateStr(daysAgo(3)), expiresAt: dateStr(daysAgo(-27)) },
    { itemId: bySku["RM-VANILLA"].id, lotNumber: "VAN-2026-001", quantityOnHand: "50.000", producedAt: dateStr(daysAgo(60)), expiresAt: dateStr(daysAgo(-670)) },
    { itemId: bySku["RM-PECTIN"].id, lotNumber: "PECTIN-2026-001", quantityOnHand: "120.000", producedAt: dateStr(daysAgo(30)), expiresAt: dateStr(daysAgo(-335)) },
    { itemId: bySku["FG-CAKE-CH"].id, lotNumber: "CAKE-2026-001", quantityOnHand: "45.000", producedAt: dateStr(daysAgo(2)), expiresAt: dateStr(daysAgo(-12)) },
    { itemId: bySku["FG-BREAD-WH"].id, lotNumber: "BREAD-2026-001", quantityOnHand: "120.000", producedAt: dateStr(daysAgo(1)), expiresAt: dateStr(daysAgo(-4)) },
    { itemId: bySku["FG-COOKIE-VAN"].id, lotNumber: "COOK-2026-001", quantityOnHand: "200.000", producedAt: dateStr(daysAgo(4)), expiresAt: dateStr(daysAgo(-56)) },
    { itemId: bySku["WIP-DOUGH"].id, lotNumber: "DOUGH-2026-001", quantityOnHand: "75.000", producedAt: dateStr(daysAgo(0)), expiresAt: dateStr(daysAgo(-2)) },
  ]
  const lotsInserted = await db.insert(lots).values(lotData).onConflictDoNothing().returning()
  console.log(`  ✓ ${lotsInserted.length} extra lots inserted`)

  // ── BOMs ──
  const jamItem = bySku["FG-JAM-500"]
  const cakeItem = bySku["FG-CAKE-CH"]
  const breadItem = bySku["FG-BREAD-WH"]
  const cookieItem = bySku["FG-COOKIE-VAN"]

  const bomRows = [
    { facilityId: F, productItemId: jamItem.id, version: 1, status: "active" as const },
    { facilityId: F, productItemId: cakeItem.id, version: 1, status: "active" as const },
    { facilityId: F, productItemId: breadItem.id, version: 1, status: "active" as const },
    { facilityId: F, productItemId: cookieItem.id, version: 1, status: "active" as const },
  ]
  const insertedBoms = await db.insert(boms).values(bomRows).onConflictDoNothing().returning()
  console.log(`  ✓ ${insertedBoms.length} BOMs inserted`)

  if (insertedBoms.length > 0) {
    const [jamBom, cakeBom, breadBom, cookieBom] = insertedBoms

    await db.insert(bomLines).values([
      // Jam BOM: sugar + pectin
      { bomId: jamBom.id, componentItemId: bySku["RM-SUGAR"].id, quantityPer: "0.3000" },
      { bomId: jamBom.id, componentItemId: bySku["RM-PECTIN"].id, quantityPer: "0.0200" },
      // Cake BOM: flour + butter + eggs + sugar + vanilla
      { bomId: cakeBom.id, componentItemId: bySku["RM-FLOUR"].id, quantityPer: "0.4000" },
      { bomId: cakeBom.id, componentItemId: bySku["RM-BUTTER"].id, quantityPer: "0.2500" },
      { bomId: cakeBom.id, componentItemId: bySku["RM-EGGS"].id, quantityPer: "4.0000" },
      { bomId: cakeBom.id, componentItemId: bySku["RM-SUGAR"].id, quantityPer: "0.2000" },
      { bomId: cakeBom.id, componentItemId: bySku["RM-VANILLA"].id, quantityPer: "0.0100" },
      // Bread BOM: flour + eggs
      { bomId: breadBom.id, componentItemId: bySku["RM-FLOUR"].id, quantityPer: "0.5000" },
      { bomId: breadBom.id, componentItemId: bySku["RM-EGGS"].id, quantityPer: "2.0000" },
      // Cookie BOM: flour + butter + sugar + vanilla
      { bomId: cookieBom.id, componentItemId: bySku["RM-FLOUR"].id, quantityPer: "0.1500" },
      { bomId: cookieBom.id, componentItemId: bySku["RM-BUTTER"].id, quantityPer: "0.1000" },
      { bomId: cookieBom.id, componentItemId: bySku["RM-SUGAR"].id, quantityPer: "0.0800" },
      { bomId: cookieBom.id, componentItemId: bySku["RM-VANILLA"].id, quantityPer: "0.0050" },
    ])
    console.log("  ✓ BOM lines inserted")

    // ── Work Orders (mix of statuses + completed ones spread across the week) ──
    const allBoms = await db.select().from(boms).where(eq(boms.status, "active"))
    const bomMap = Object.fromEntries(allBoms.map(b => [b.productItemId, b]))

    const woData = [
      // Completed work orders spread across the last 7 days (fills the charts)
      { facilityId: F, productItemId: jamItem.id, bomId: bomMap[jamItem.id].id, quantityPlanned: "100.000", quantityProduced: "98.000", status: "completed" as const, scheduledFor: dateStr(daysAgo(6)), createdAt: daysAgo(7), completedAt: daysAgo(6) },
      { facilityId: F, productItemId: breadItem.id, bomId: bomMap[breadItem.id].id, quantityPlanned: "200.000", quantityProduced: "195.000", status: "completed" as const, scheduledFor: dateStr(daysAgo(5)), createdAt: daysAgo(6), completedAt: daysAgo(5) },
      { facilityId: F, productItemId: cookieItem.id, bomId: bomMap[cookieItem.id].id, quantityPlanned: "150.000", quantityProduced: "148.000", status: "completed" as const, scheduledFor: dateStr(daysAgo(4)), createdAt: daysAgo(5), completedAt: daysAgo(4) },
      { facilityId: F, productItemId: cakeItem.id, bomId: bomMap[cakeItem.id].id, quantityPlanned: "50.000", quantityProduced: "47.000", status: "completed" as const, scheduledFor: dateStr(daysAgo(3)), createdAt: daysAgo(4), completedAt: daysAgo(3) },
      { facilityId: F, productItemId: jamItem.id, bomId: bomMap[jamItem.id].id, quantityPlanned: "120.000", quantityProduced: "120.000", status: "completed" as const, scheduledFor: dateStr(daysAgo(2)), createdAt: daysAgo(3), completedAt: daysAgo(2) },
      { facilityId: F, productItemId: breadItem.id, bomId: bomMap[breadItem.id].id, quantityPlanned: "180.000", quantityProduced: "175.000", status: "completed" as const, scheduledFor: dateStr(daysAgo(1)), createdAt: daysAgo(2), completedAt: daysAgo(1) },
      { facilityId: F, productItemId: cookieItem.id, bomId: bomMap[cookieItem.id].id, quantityPlanned: "200.000", quantityProduced: "192.000", status: "completed" as const, scheduledFor: dateStr(daysAgo(0)), createdAt: daysAgo(1), completedAt: daysAgo(0) },
      // Active planned/released work orders (show up in "Open WO" + "Active Work Orders")
      { facilityId: F, productItemId: cakeItem.id, bomId: bomMap[cakeItem.id].id, quantityPlanned: "75.000", quantityProduced: "0.000", status: "planned" as const, scheduledFor: dateStr(daysAgo(-1)), createdAt: daysAgo(1) },
      { facilityId: F, productItemId: jamItem.id, bomId: bomMap[jamItem.id].id, quantityPlanned: "200.000", quantityProduced: "0.000", status: "released" as const, scheduledFor: dateStr(daysAgo(0)), createdAt: daysAgo(2) },
      { facilityId: F, productItemId: breadItem.id, bomId: bomMap[breadItem.id].id, quantityPlanned: "300.000", quantityProduced: "0.000", status: "planned" as const, scheduledFor: dateStr(daysAgo(-2)), createdAt: daysAgo(0) },
      { facilityId: F, productItemId: cookieItem.id, bomId: bomMap[cookieItem.id].id, quantityPlanned: "100.000", quantityProduced: "0.000", status: "released" as const, scheduledFor: dateStr(daysAgo(-1)), createdAt: daysAgo(0) },
      // One late work order (past due date, still planned)
      { facilityId: F, productItemId: cakeItem.id, bomId: bomMap[cakeItem.id].id, quantityPlanned: "40.000", quantityProduced: "0.000", status: "planned" as const, scheduledFor: dateStr(daysAgo(2)), createdAt: daysAgo(5) },
    ]
    await db.insert(workOrders).values(woData)
    console.log("  ✓ 12 work orders inserted (7 completed, 4 active, 1 late)")
  }

  // ── Extra parties + purchase orders ──
  const extraParties = [
    { facilityId: F, type: "supplier" as const, name: "Moulin du Sud SPA", phone: "+213-555-100-200" },
    { facilityId: F, type: "customer" as const, name: "Supermarché El Baraka", phone: "+213-555-300-400" },
    { facilityId: F, type: "customer" as const, name: "Pâtisserie Royale SARL", phone: "+213-555-500-600" },
  ]
  await db.insert(parties).values(extraParties).onConflictDoNothing()

  const suppliers = await db.select().from(parties).where(eq(parties.type, "supplier"))
  const supp = suppliers[suppliers.length - 1]

  const [po2] = await db.insert(purchaseOrders).values({
    facilityId: F, supplierId: supp.id, status: "received" as const, totalAmount: "450000.00",
  }).returning()
  await db.insert(purchaseOrderLines).values([
    { poId: po2.id, itemId: bySku["RM-FLOUR"].id, description: "Wheat Flour T55", quantity: "2500.000", unitPrice: "120.00", lineTotal: "300000.00" },
    { poId: po2.id, itemId: bySku["RM-BUTTER"].id, description: "Unsalted Butter", quantity: "300.000", unitPrice: "500.00", lineTotal: "150000.00" },
  ])

  console.log("\n✅ Dashboard seed complete!")
  console.log("   → Open work orders, completed WOs with yield data,")
  console.log("   → inventory lots, BOMs, purchase orders")
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
