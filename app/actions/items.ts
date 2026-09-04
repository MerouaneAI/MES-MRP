"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { authorize } from "@/lib/authz"
import { db } from "@/db"
import { items } from "@/db/schema/inventory"
import { FACILITY_ID } from "@/lib/constants"
import type { FormState } from "@/lib/types"

const itemSchema = z.object({
  kind: z.enum(["raw_material", "finished_good", "wip"]),
  sku: z.string().trim().min(1, "SKU is required").max(60),
  name: z.string().trim().min(1, "Name is required").max(200),
  unit: z.string().trim().min(1, "Unit is required").max(20),
  shelfLifeDays: z.string().trim().regex(/^\d*$/, "Shelf life must be a whole number of days"),
})

function parseItemForm(formData: FormData) {
  return itemSchema.safeParse({
    kind: formData.get("kind"),
    sku: formData.get("sku") ?? "",
    name: formData.get("name") ?? "",
    unit: formData.get("unit") ?? "kg",
    shelfLifeDays: formData.get("shelfLifeDays") ?? "",
  })
}

function toColumns(v: z.infer<typeof itemSchema>) {
  return {
    kind: v.kind,
    sku: v.sku,
    name: v.name,
    unit: v.unit,
    shelfLifeDays: v.shelfLifeDays === "" ? null : Number(v.shelfLifeDays),
  }
}

export async function createItem(_prev: FormState, formData: FormData): Promise<FormState> {
  const gate = await authorize("operator")
  if (!gate.ok) return gate

  const parsed = parseItemForm(formData)
  if (!parsed.success) {
    return { ok: false, error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors }
  }

  try {
    await db.insert(items).values({ facilityId: FACILITY_ID, ...toColumns(parsed.data) })
  } catch {
    return { ok: false, error: "An item with this SKU already exists." }
  }

  revalidatePath("/items")
  redirect("/items")
}

export async function updateItem(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const gate = await authorize("operator")
  if (!gate.ok) return gate

  const parsed = parseItemForm(formData)
  if (!parsed.success) {
    return { ok: false, error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors }
  }

  try {
    await db.update(items).set(toColumns(parsed.data)).where(eq(items.id, id))
  } catch {
    return { ok: false, error: "An item with this SKU already exists." }
  }

  revalidatePath("/items")
  redirect("/items")
}

export async function deleteItem(formData: FormData): Promise<void> {
  const gate = await authorize("admin")
  if (!gate.ok) throw new Error(gate.error)

  const id = String(formData.get("id") ?? "")
  if (!id) return

  try {
    await db.delete(items).where(eq(items.id, id))
  } catch {
    // Item has lots (FK). Keep it; surface this to the user in a real app.
  }
  revalidatePath("/items")
}