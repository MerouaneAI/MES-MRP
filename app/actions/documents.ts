"use server"

import { revalidatePath } from "next/cache"
import { authorize } from "@/lib/authz"
import { db } from "@/db"
import { documents } from "@/db/schema/documents"
import { FACILITY_ID } from "@/lib/constants"
import { documentsQueue } from "@/lib/queue"

export async function enqueuePoPdf(formData: FormData): Promise<void> {
  const gate = await authorize("operator")
  if (!gate.ok) throw new Error(gate.error)

  const poId = String(formData.get("poId") ?? "")
  if (!poId) return

  const [doc] = await db.insert(documents).values({
    facilityId: FACILITY_ID, kind: "po_pdf", refId: poId, status: "queued",
  }).returning()

  await documentsQueue.add("po_pdf", { kind: "po_pdf", documentId: doc.id, poId })
  revalidatePath("/documents")
}

export async function enqueueCoaPdf(formData: FormData): Promise<void> {
  const gate = await authorize("operator")
  if (!gate.ok) throw new Error(gate.error)

  const lotId = String(formData.get("lotId") ?? "")
  if (!lotId) return

  const [doc] = await db.insert(documents).values({
    facilityId: FACILITY_ID, kind: "coa_pdf", refId: lotId, status: "queued",
  }).returning()

  await documentsQueue.add("coa_pdf", { kind: "coa_pdf", documentId: doc.id, lotId })
  revalidatePath("/documents")
}
