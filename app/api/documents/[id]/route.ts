import { readFile } from "node:fs/promises"
import { eq } from "drizzle-orm"
import { auth } from "@/auth"
import { db } from "@/db"
import { documents } from "@/db/schema/documents"

export const dynamic = "force-dynamic"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return new Response("Unauthorized", { status: 401 })

  const { id } = await params
  const [doc] = await db.select().from(documents).where(eq(documents.id, id))
  if (!doc) return new Response("Not found", { status: 404 })
  if (doc.status !== "done" || !doc.filePath) return new Response("Not ready", { status: 409 })

  let bytes: Buffer
  try {
    bytes = await readFile(doc.filePath)
  } catch {
    return new Response("File missing", { status: 410 })
  }

  const fileName = `${doc.kind}-${doc.refId.slice(0, 8)}.pdf`
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  })
}
