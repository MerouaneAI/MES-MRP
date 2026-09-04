"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { and, eq, ne, sql } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { db } from "@/db"
import { users } from "@/db/schema/auth"
import { authorize } from "@/lib/authz"
import { recordAudit } from "@/lib/audit"
import type { FormState } from "@/lib/types"

const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  role: z.enum(["admin", "operator", "viewer"]),
  password: z.string().min(10, "Password must be at least 10 characters"),
})

export async function createUser(_prev: FormState, formData: FormData): Promise<FormState> {
  const gate = await authorize("admin", { fresh: true })
  if (!gate.ok) return gate

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    password: formData.get("password"),
  })
  if (!parsed.success) {
    return { ok: false, error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10)
  try {
    const [created] = await db.insert(users).values({
      name: parsed.data.name, email: parsed.data.email, role: parsed.data.role, passwordHash,
    }).returning()
    await recordAudit(db, {
      user: gate.user, action: "user.create", entity: "user", entityId: created.id,
      summary: `Created user ${created.email} (${created.role})`,
    })
  } catch {
    return { ok: false, error: "A user with this email already exists." }
  }

  revalidatePath("/users")
  redirect("/users")
}

// Shared guard: are we about to remove the LAST active admin? (Trap #3)
async function isLastActiveAdmin(excludingUserId: string): Promise<boolean> {
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)` })
    .from(users)
    .where(and(eq(users.role, "admin"), eq(users.isActive, true), ne(users.id, excludingUserId)))
  return Number(n) === 0
}

export async function setUserRole(formData: FormData): Promise<void> {
  const gate = await authorize("admin", { fresh: true })
  if (!gate.ok) throw new Error(gate.error)

  const userId = String(formData.get("userId") ?? "")
  const role = String(formData.get("role") ?? "") as "admin" | "operator" | "viewer"
  if (!userId || !["admin", "operator", "viewer"].includes(role)) return

  const [target] = await db.select().from(users).where(eq(users.id, userId))
  if (!target) return
  if (target.role === "admin" && role !== "admin" && (await isLastActiveAdmin(userId))) {
    throw new Error("You cannot remove the last remaining admin.")
  }

  await db.update(users).set({ role }).where(eq(users.id, userId))
  await recordAudit(db, {
    user: gate.user, action: "user.set_role", entity: "user", entityId: userId,
    summary: `Set ${target.email} role to ${role}`,
  })
  revalidatePath("/users")
}

export async function setUserActive(formData: FormData): Promise<void> {
  const gate = await authorize("admin", { fresh: true })
  if (!gate.ok) throw new Error(gate.error)

  const userId = String(formData.get("userId") ?? "")
  const active = String(formData.get("active") ?? "") === "true"
  if (!userId) return
  if (userId === gate.user.id && !active) throw new Error("You cannot deactivate your own account.")
  if (!active && (await isLastActiveAdmin(userId))) throw new Error("You cannot deactivate the last remaining admin.")

  await db.update(users).set({ isActive: active }).where(eq(users.id, userId))
  await recordAudit(db, {
    user: gate.user, action: "user.set_active", entity: "user", entityId: userId,
    summary: `${active ? "Reactivated" : "Deactivated"} ${target?.email ?? userId}`,
  })
  revalidatePath("/users")
}

export async function resetUserPassword(formData: FormData): Promise<void> {
  const gate = await authorize("admin", { fresh: true })
  if (!gate.ok) throw new Error(gate.error)

  const userId = String(formData.get("userId") ?? "")
  const password = String(formData.get("password") ?? "")
  if (!userId || password.length < 10) throw new Error("Password must be at least 10 characters.")

  const passwordHash = await bcrypt.hash(password, 10)
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId))
  await recordAudit(db, {
    user: gate.user, action: "user.reset_password", entity: "user", entityId: userId,
    summary: "Reset user password",
  })
  revalidatePath("/users")
}