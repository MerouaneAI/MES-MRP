import { Queue } from "bullmq"
import { redis } from "./redis"

export const DOCUMENTS_QUEUE = "documents"

export type DocumentJob =
  | { kind: "po_pdf"; documentId: string; poId: string }
  | { kind: "coa_pdf"; documentId: string; lotId: string }

export const documentsQueue = new Queue<DocumentJob>(DOCUMENTS_QUEUE, { connection: redis })
