// app/account/page.tsx
import { redirect } from "next/navigation"
import { currentUser } from "@/lib/session"
import { ChangePasswordForm } from "./account-form"

export const dynamic = "force-dynamic"

export default async function AccountPage() {
  const me = await currentUser()
  if (!me) redirect("/login")
  return (
    <div className="space-y-6">
      <h1>My account</h1>
      <p>{me.email} · role: <b>{me.role}</b></p>
      <ChangePasswordForm />
    </div>
  )
}