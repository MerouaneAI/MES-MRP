"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { and, eq, sql } from "drizzle-orm"
import { z } from "zod"
import { auth } from "@/auth"
import { db } from "@/db"
import { boms, bomLines } from "@/db/schema/production"
import { FACILITY_ID } from "@/lib/constants"
import type { FormState } from "@/lib/types"

// Create a new DRAFT BOM for a product, auto-incrementing the version.
const bomSchema = z.object({
  productItemId: z.string().uuid("Choose a product"),
  notes: z.string().trim().max(500).optional(),
})

export async function createBom(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await auth()
  if (!session?.user) return { ok: false, error: "Unauthorized" }

  const parsed = bomSchema.safeParse({
    productItemId: formData.get("productItemId"),
    notes: formData.get("notes") ?? "",
  })
  if (!parsed.success) {
    return { ok: false, error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const created = await db.transaction(async (tx) => {
    // next version = max(version) + 1 for this product
    const [{ maxV }] = await tx
      .select({ maxV: sql<number>`coalesce(max(${boms.version}), 0)` })
      .from(boms)
      .where(eq(boms.productItemId, parsed.data.productItemId))
    const [row] = await tx.insert(boms).values({
      facilityId: FACILITY_ID,
      productItemId: parsed.data.productItemId,
      version: Number(maxV) + 1,
      status: "draft",
      notes: parsed.data.notes || null,
    }).returning()
    return row
  })

  revalidatePath("/boms")
  redirect(`/boms/${created.id}`)
}

// Add a component line — only allowed while the BOM is a draft.
const lineSchema = z.object({
  componentItemId: z.string().uuid("Choose a component"),
  quantityPer: z.string().trim().regex(/^\d+(\.\d{1,4})?$/, "Quantity per unit must be a number (up to 4 decimals)"),
})

export async function addBomLine(bomId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const session = await auth()
  if (!session?.user) return { ok: false, error: "Unauthorized" }

  const parsed = lineSchema.safeParse({
    componentItemId: formData.get("componentItemId"),
    quantityPer: formData.get("quantityPer") ?? "",
  })
  if (!parsed.success) {
    return { ok: false, error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const [bom] = await db.select().from(boms).where(eq(boms.id, bomId))
  if (!bom) return { ok: false, error: "BOM not found." }
  if (bom.status !== "draft") return { ok: false, error: "Only draft BOMs can be edited. Create a new version via an ECO." }
  if (parsed.data.componentItemId === bom.productItemId) return { ok: false, error: "A product cannot be a component of itself." }

  await db.insert(bomLines).values({
    bomId,
    componentItemId: parsed.data.componentItemId,
    quantityPer: parsed.data.quantityPer,
  })

  revalidatePath(`/boms/${bomId}`)
  return { ok: true }
}

export async function removeBomLine(formData: FormData): Promise<void> {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const lineId = String(formData.get("lineId") ?? "")
  const bomId = String(formData.get("bomId") ?? "")
  if (!lineId || !bomId) return

  const [bom] = await db.select().from(boms).where(eq(boms.id, bomId))
  if (!bom || bom.status !== "draft") return // locked once activated

  await db.delete(bomLines).where(eq(bomLines.id, lineId))
  revalidatePath(`/boms/${bomId}`)
}

// Activate a DRAFT BOM. Only for the FIRST version (no active exists yet).
// Changing an already-active recipe must go through an ECO.
export async function activateBom(formData: FormData): Promise<void> {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const bomId = String(formData.get("bomId") ?? "")
  if (!bomId) return

  await db.transaction(async (tx) => {
    const [bom] = await tx.select().from(boms).where(eq(boms.id, bomId))
    if (!bom || bom.status !== "draft") return

    const lines = await tx.select({ id: bomLines.id }).from(bomLines).where(eq(bomLines.bomId, bomId))
    if (lines.length === 0) return // never activate an empty recipe

    const [active] = await tx.select().from(boms)
      .where(and(eq(boms.productItemId, bom.productItemId), eq(boms.status, "active")))
    if (active) return // an active version exists -> must use an ECO instead

    await tx.update(boms).set({ status: "active" }).where(eq(boms.id, bomId))
  })

  revalidatePath("/boms")
  revalidatePath(`/boms/${bomId}`)
}
