"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { auth } from "@/auth"
import { db } from "@/db"
import { lots } from "@/db/schema/inventory"
import type { FormState } from "@/lib/types"

const lotSchema = z.object({
  itemId: z.string().uuid("Choose an item"),
  lotNumber: z.string().trim().min(1, "Lot number is required").max(60),
  quantityOnHand: z.string().trim().regex(/^\d+(\.\d{1,3})?$/, "Quantity must be a number (up to 3 decimals)"),
  producedAt: z.string().trim().optional(),
  expiresAt: z.string().trim().optional(),
})

function parseLotForm(formData: FormData) {
  return lotSchema.safeParse({
    itemId: formData.get("itemId"),
    lotNumber: formData.get("lotNumber") ?? "",
    quantityOnHand: formData.get("quantityOnHand") ?? "",
    producedAt: formData.get("producedAt") ?? "",
    expiresAt: formData.get("expiresAt") ?? "",
  })
}

function toColumns(v: z.infer<typeof lotSchema>) {
  return {
    itemId: v.itemId,
    lotNumber: v.lotNumber,
    quantityOnHand: v.quantityOnHand,               // keep the STRING (numeric column)
    producedAt: v.producedAt ? v.producedAt : null, // date column = "YYYY-MM-DD" string
    expiresAt: v.expiresAt ? v.expiresAt : null,
  }
}

export async function createLot(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await auth()
  if (!session?.user) return { ok: false, error: "Unauthorized" }

  const parsed = parseLotForm(formData)
  if (!parsed.success) {
    return { ok: false, error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors }
  }

  await db.insert(lots).values(toColumns(parsed.data))
  revalidatePath("/lots")
  redirect("/lots")
}

export async function updateLot(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const session = await auth()
  if (!session?.user) return { ok: false, error: "Unauthorized" }

  const parsed = parseLotForm(formData)
  if (!parsed.success) {
    return { ok: false, error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors }
  }

  await db.update(lots).set(toColumns(parsed.data)).where(eq(lots.id, id))
  revalidatePath("/lots")
  redirect("/lots")
}

export async function deleteLot(formData: FormData): Promise<void> {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const id = String(formData.get("id") ?? "")
  if (!id) return
  try {
    await db.delete(lots).where(eq(lots.id, id))
  } catch {
    // Lot is referenced by lot_genealogy (used in production). Keep it.
  }
  revalidatePath("/lots")
}