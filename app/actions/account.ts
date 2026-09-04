"use server"

import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { db } from "@/db"
import { users } from "@/db/schema/auth"
import { authorize } from "@/lib/authz"
import { recordAudit } from "@/lib/audit"
import type { FormState } from "@/lib/types"

const schema = z.object({
  currentPassword: z.string().min(1, "Enter your current password"),
  newPassword: z.string().min(10, "New password must be at least 10 characters"),
})

export async function changeMyPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const gate = await authorize("viewer") // any signed-in user
  if (!gate.ok) return gate

  const parsed = schema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  })
  if (!parsed.success) {
    return { ok: false, error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const [me] = await db.select().from(users).where(eq(users.id, gate.user.id))
  if (!me) return { ok: false, error: "Account not found." }
  const valid = await bcrypt.compare(parsed.data.currentPassword, me.passwordHash)
  if (!valid) return { ok: false, error: "Current password is incorrect." }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10)
  await db.update(users).set({ passwordHash }).where(eq(users.id, me.id))
  await recordAudit(db, {
    user: gate.user, action: "account.change_password", entity: "user", entityId: me.id,
    summary: "Changed own password",
  })
  return { ok: true }
}