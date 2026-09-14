// app/(app)/dashboard/queries.ts
import { and, count, desc, eq, gte, inArray, sql } from "drizzle-orm"
import { db } from "@/db"
import { workOrders } from "@/db/schema/production"
import { items, lots } from "@/db/schema/inventory"
import { invoices } from "@/db/schema/invoices"
import { parties } from "@/db/schema/parties"

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const dayIndex = (d: Date) => (d.getDay() + 6) % 7   // Mon=0 … Sun=6

export async function getDashboardData() {
  const weekAgo = new Date(Date.now() - 7 * 86400000)

  const [openWo] = await db.select({ n: count() }).from(workOrders)
    .where(inArray(workOrders.status, ["planned", "released"]))

  const [newWoWeek] = await db.select({ n: count() }).from(workOrders)
    .where(gte(workOrders.createdAt, weekAgo))

  const [numParties] = await db.select({
    total: count(),
  }).from(parties)

  const [returnedInvoices] = await db.select({ n: count() }).from(invoices)
    .where(eq(invoices.status, "returned"))

  const [y] = await db.select({
    planned: sql<string>`coalesce(sum(${workOrders.quantityPlanned}), 0)`,
    produced: sql<string>`coalesce(sum(${workOrders.quantityProduced}), 0)`,
  }).from(workOrders).where(eq(workOrders.status, "completed"))
  const yieldPct = Number(y.planned) > 0 ? (Number(y.produced) / Number(y.planned)) * 100 : 0

  const activeWorkOrders = await db.select({
    id: workOrders.id, status: workOrders.status,
    quantityPlanned: workOrders.quantityPlanned,
    productName: items.name, productSku: items.sku,
  }).from(workOrders)
    .innerJoin(items, eq(workOrders.productItemId, items.id))
    .where(inArray(workOrders.status, ["planned", "released"]))
    .orderBy(desc(workOrders.createdAt)).limit(6)

  const recentInventory = await db.select({
    id: lots.id, lotNumber: lots.lotNumber, qty: lots.quantityOnHand,
    createdAt: lots.createdAt, itemName: items.name,
  }).from(lots)
    .innerJoin(items, eq(lots.itemId, items.id))
    .orderBy(desc(lots.createdAt)).limit(6)

  return { openWo, newWoWeek, numParties, returnedInvoices, yieldPct, activeWorkOrders, recentInventory }
}

// Bucket the last 7 days of invoices into total vs delivered.
export async function getCharts() {
  const since = new Date(Date.now() - 6 * 86400000)
  since.setHours(0, 0, 0, 0)

  const recentInvoices = await db.select({
    issuedAt: invoices.issuedAt,
    status: invoices.status,
  }).from(invoices)
    .where(gte(invoices.issuedAt, since))

  const output = DAYS.map((day) => ({ day, total: 0, delivered: 0 }))
  for (const r of recentInvoices) {
    if (!r.issuedAt) continue
    const i = dayIndex(new Date(r.issuedAt))
    output[i].total += 1
    if (r.status === "delivered") {
      output[i].delivered += 1
    }
  }
  
  const completed = await db.select({
    completedAt: workOrders.completedAt,
    produced: workOrders.quantityProduced,
    planned: workOrders.quantityPlanned,
  }).from(workOrders)
    .where(and(eq(workOrders.status, "completed"), gte(workOrders.completedAt, since)))

  const yieldData = DAYS.map((day) => ({ day, planned: 0, actual: 0 }))
  for (const r of completed) {
    if (!r.completedAt) continue
    const i = dayIndex(new Date(r.completedAt))
    yieldData[i].planned += Number(r.planned)
    yieldData[i].actual += Number(r.produced)
  }

  const yieldSeries = yieldData.map((o) => ({
    day: o.day,
    yield: o.planned > 0 ? Math.round((o.actual / o.planned) * 1000) / 10 : 0,
  }))
  return { output, yieldSeries }
}