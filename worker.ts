import "dotenv/config"
import { Worker } from "bullmq"
import { eq } from "drizzle-orm"
import { db } from "./db"
import { documents } from "./db/schema/documents"
import { purchaseOrders, purchaseOrderLines } from "./db/schema/purchases"
import { parties } from "./db/schema/parties"
import { items, lots } from "./db/schema/inventory"
import { redis } from "./lib/redis"
import { DOCUMENTS_QUEUE, type DocumentJob } from "./lib/queue"
import { renderPoPdf, renderCoaPdf } from "./lib/pdf"

const worker = new Worker<DocumentJob>(
  DOCUMENTS_QUEUE,
  async (job) => {
    const data = job.data
    await db.update(documents).set({ status: "processing" }).where(eq(documents.id, data.documentId))

    try {
      let filePath: string
      if (data.kind === "po_pdf") {
        const [po] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, data.poId))
        if (!po) throw new Error("PO not found")
        const [supplier] = await db.select().from(parties).where(eq(parties.id, po.supplierId))
        const lines = await db.select().from(purchaseOrderLines).where(eq(purchaseOrderLines.poId, po.id))
        filePath = await renderPoPdf({
          poId: po.id,
          supplierName: supplier?.name ?? "—",
          status: po.status,
          totalAmount: po.totalAmount,
          lines: lines.map((l) => ({
            description: l.description ?? l.itemId,
            quantity: l.quantity, unitPrice: l.unitPrice, lineTotal: l.lineTotal,
          })),
        })
      } else {
        const [lot] = await db.select().from(lots).where(eq(lots.id, data.lotId))
        if (!lot) throw new Error("Lot not found")
        const [item] = await db.select().from(items).where(eq(items.id, lot.itemId))
        filePath = await renderCoaPdf({
          lotId: lot.id,
          itemName: item?.name ?? "—",
          lotNumber: lot.lotNumber,
          quantityOnHand: lot.quantityOnHand,
          producedAt: lot.producedAt,
          expiresAt: lot.expiresAt,
        })
      }

      await db.update(documents)
        .set({ status: "done", filePath, completedAt: new Date() })
        .where(eq(documents.id, data.documentId))
    } catch (e) {
      await db.update(documents)
        .set({ status: "failed", error: e instanceof Error ? e.message : "PDF generation failed" })
        .where(eq(documents.id, data.documentId))
      throw e // let BullMQ record the failure (and retry if configured)
    }
  },
  { connection: redis },
)

worker.on("completed", (job) => console.log(`Document job ${job.id} completed`))
worker.on("failed", (job, err) => console.error(`Document job ${job?.id} failed:`, err.message))

console.log("Documents worker started. Waiting for jobs…")
