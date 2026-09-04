"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { and, eq } from "drizzle-orm"
import { z } from "zod"
import { authorize } from "@/lib/authz"
import { db } from "@/db"
import { boms, engineeringChangeOrders } from "@/db/schema/production"
import { FACILITY_ID } from "@/lib/constants"
import { recordAudit } from "@/lib/audit"
import type { FormState } from "@/lib/types"

const ecoSchema = z.object({
  productItemId: z.string().uuid("Choose a product"),
  toBomId: z.string().uuid("Choose the target version"),
  reason: z.string().trim().min(1, "Reason is required").max(500),
})

export async function createEco(_prev: FormState, formData: FormData): Promise<FormState> {
  const gate = await authorize("admin", { fresh: true })
  if (!gate.ok) return gate

  const parsed = ecoSchema.safeParse({
    productItemId: formData.get("productItemId"),
    toBomId: formData.get("toBomId"),
    reason: formData.get("reason") ?? "",
  })
  if (!parsed.success) {
    return { ok: false, error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors }
  }

  // Target must be a DRAFT BOM for this product; from = current active (may be null).
  const [target] = await db.select().from(boms).where(eq(boms.id, parsed.data.toBomId))
  if (!target || target.productItemId !== parsed.data.productItemId) return { ok: false, error: "Target version does not belong to this product." }
  if (target.status !== "draft") return { ok: false, error: "The target version must be a draft." }

  const [active] = await db.select().from(boms)
    .where(and(eq(boms.productItemId, parsed.data.productItemId), eq(boms.status, "active")))

  await db.insert(engineeringChangeOrders).values({
    facilityId: FACILITY_ID,
    productItemId: parsed.data.productItemId,
    fromBomId: active?.id ?? null,
    toBomId: parsed.data.toBomId,
    reason: parsed.data.reason,
    status: "draft",
  })

  revalidatePath("/eco")
  redirect("/eco")
}

// Apply: archive the current active version and activate the target, atomically.
// The conditional flip on the ECO row makes it idempotent.
export async function applyEco(formData: FormData): Promise<void> {
  const gate = await authorize("admin", { fresh: true })
  if (!gate.ok) throw new Error(gate.error)

  const ecoId = String(formData.get("ecoId") ?? "")
  if (!ecoId) return

  await db.transaction(async (tx) => {
    const [eco] = await tx.update(engineeringChangeOrders)
      .set({ status: "applied", appliedAt: new Date() })
      .where(and(eq(engineeringChangeOrders.id, ecoId), eq(engineeringChangeOrders.status, "draft")))
      .returning()
    if (!eco) return // already applied/cancelled -> idempotent no-op

    await tx.update(boms).set({ status: "archived" })
      .where(and(eq(boms.productItemId, eco.productItemId), eq(boms.status, "active")))
    await tx.update(boms).set({ status: "active" }).where(eq(boms.id, eco.toBomId))

    await recordAudit(tx, {
      user: gate.user, action: "eco.apply", entity: "eco", entityId: ecoId,
      summary: `Applied ECO ${ecoId.slice(0, 8)} — activated BOM ${eco.toBomId.slice(0, 8)}`,
    })
  })

  revalidatePath("/eco")
  revalidatePath("/boms")
}

export async function cancelEco(formData: FormData): Promise<void> {
  const gate = await authorize("admin", { fresh: true })
  if (!gate.ok) throw new Error(gate.error)

  const ecoId = String(formData.get("ecoId") ?? "")
  if (!ecoId) return

  await db.update(engineeringChangeOrders)
    .set({ status: "cancelled" })
    .where(and(eq(engineeringChangeOrders.id, ecoId), eq(engineeringChangeOrders.status, "draft")))

  revalidatePath("/eco")
}
