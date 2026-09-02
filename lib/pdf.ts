import PDFDocument from "pdfkit"
import { createWriteStream } from "node:fs"
import { mkdir } from "node:fs/promises"
import path from "node:path"

export const STORAGE_DIR = process.env.STORAGE_DIR ?? "./storage"

export type PoPdfData = {
  poId: string
  supplierName: string
  status: string
  totalAmount: string
  lines: Array<{ description: string; quantity: string; unitPrice: string; lineTotal: string }>
}

export type CoaPdfData = {
  lotId: string
  itemName: string
  lotNumber: string
  quantityOnHand: string
  producedAt: string | null
  expiresAt: string | null
}

async function renderToFile(fileName: string, draw: (doc: PDFKit.PDFDocument) => void): Promise<string> {
  await mkdir(STORAGE_DIR, { recursive: true })
  const filePath = path.join(STORAGE_DIR, fileName)
  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 })
    const stream = createWriteStream(filePath)
    doc.pipe(stream)
    draw(doc)
    doc.end()
    stream.on("finish", () => resolve())
    stream.on("error", reject)
  })
  return filePath
}

export function renderPoPdf(data: PoPdfData): Promise<string> {
  return renderToFile(`po-${data.poId}.pdf`, (doc) => {
    doc.fontSize(18).text("Purchase Order", { underline: true })
    doc.moveDown().fontSize(11)
    doc.text(`PO: ${data.poId}`)
    doc.text(`Supplier: ${data.supplierName}`)
    doc.text(`Status: ${data.status}`)
    doc.moveDown().text("Lines:")
    for (const l of data.lines) {
      doc.text(`  • ${l.description}  —  ${l.quantity} x ${l.unitPrice} = ${l.lineTotal} DZD`)
    }
    doc.moveDown().fontSize(13).text(`Total: ${data.totalAmount} DZD`)
  })
}

export function renderCoaPdf(data: CoaPdfData): Promise<string> {
  return renderToFile(`coa-${data.lotId}.pdf`, (doc) => {
    doc.fontSize(18).text("Certificate of Analysis", { underline: true })
    doc.moveDown().fontSize(11)
    doc.text(`Product: ${data.itemName}`)
    doc.text(`Lot: ${data.lotNumber}`)
    doc.text(`Quantity on hand: ${data.quantityOnHand}`)
    doc.text(`Produced: ${data.producedAt ?? "—"}`)
    doc.text(`Expires: ${data.expiresAt ?? "—"}`)
  })
}
