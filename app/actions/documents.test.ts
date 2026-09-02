import "dotenv/config"
import { describe, it, expect, vi, afterAll } from "vitest"

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/auth", () => ({ auth: vi.fn(async () => ({ user: { id: "test", role: "admin" } })) }))

const add = vi.fn(async () => ({}))
vi.mock("@/lib/queue", () => ({ documentsQueue: { add: (...a: unknown[]) => add(...a) }, DOCUMENTS_QUEUE: "documents" }))

import { enqueuePoPdf } from "@/app/actions/documents"
import { db } from "@/db"
import { documents } from "@/db/schema/documents"
import { eq } from "drizzle-orm"

const refs: string[] = []
afterAll(async () => { for (const id of refs) await db.delete(documents).where(eq(documents.refId, id)) })

function fd(obj: Record<string, string>) {
  const f = new FormData()
  for (const [k, v] of Object.entries(obj)) f.append(k, v)
  return f
}

describe("enqueuePoPdf", () => {
  it("creates a queued documents row and enqueues a job", async () => {
    const poId = crypto.randomUUID()
    refs.push(poId)
    await enqueuePoPdf(fd({ poId }))

    const [doc] = await db.select().from(documents).where(eq(documents.refId, poId))
    expect(doc?.kind).toBe("po_pdf")
    expect(doc?.status).toBe("queued")
    expect(add).toHaveBeenCalledWith("po_pdf", expect.objectContaining({ kind: "po_pdf", poId }))
  })
})
