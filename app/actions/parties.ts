"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { authorize } from "@/lib/authz"
import { db } from "@/db"
import { parties } from "@/db/schema/parties"
import { FACILITY_ID } from "@/lib/constants"
import type { FormState } from "@/lib/types"

const partySchema = z.object({
  type: z.enum(["customer", "supplier", "both"]),
  name: z.string().trim().min(1, "Name is required").max(200),
  phone: z.string().trim().max(50),
  address: z.string().trim().max(500),
  nif: z.string().trim().max(50),
  nis: z.string().trim().max(50),
  rc: z.string().trim().max(50),
  ai: z.string().trim().max(50),
})

function parsePartyForm(formData: FormData) {
  return partySchema.safeParse({
    type: formData.get("type"),
    name: formData.get("name") ?? "",
    phone: formData.get("phone") ?? "",
    address: formData.get("address") ?? "",
    nif: formData.get("nif") ?? "",
    nis: formData.get("nis") ?? "",
    rc: formData.get("rc") ?? "",
    ai: formData.get("ai") ?? "",
  })
}

// Convert "" → null so optional columns stay clean.
function toColumns(v: z.infer<typeof partySchema>) {
  return {
    type: v.type,
    name: v.name,
    phone: v.phone || null,
    address: v.address || null,
    nif: v.nif || null,
    nis: v.nis || null,
    rc: v.rc || null,
    ai: v.ai || null,
  }
}

export async function createParty(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const gate = await authorize("parties", "write")
  if (!gate.ok) return gate

  const parsed = parsePartyForm(formData)
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  await db.insert(parties).values({ facilityId: FACILITY_ID, ...toColumns(parsed.data) })

  revalidatePath("/parties")
  redirect("/parties") // LAST LINE — throws NEXT_REDIRECT by design; never try/catch it
}

export async function updateParty(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const gate = await authorize("parties", "write")
  if (!gate.ok) return gate

  const parsed = parsePartyForm(formData)
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  await db.update(parties).set(toColumns(parsed.data)).where(eq(parties.id, id))

  revalidatePath("/parties")
  redirect("/parties")
}

export async function deleteParty(formData: FormData): Promise<void> {
  const gate = await authorize("parties", "delete")
  if (!gate.ok) throw new Error(gate.error)

  const id = String(formData.get("id") ?? "")
  if (!id) return

  try {
    await db.delete(parties).where(eq(parties.id, id))
  } catch {
    // Referenced by a PO/invoice (FK). In a real app, surface this to the user.
  }
  revalidatePath("/parties")
}
