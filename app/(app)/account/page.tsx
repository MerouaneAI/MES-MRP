// app/account/page.tsx
import { redirect } from "next/navigation"
import { authorize } from "@/lib/authz"
import { ChangePasswordForm } from "./account-form"
import { PageHeader } from "@/components/ui"

export const dynamic = "force-dynamic"

export default async function AccountPage() {
  const gate = await authorize("account", "view")
  if (!gate.ok) redirect("/login")
  const me = gate.user
  return (
    <div className="space-y-6">
      <PageHeader title="My account" description={`${me.email} · role: ${me.roleName}`} />
      <ChangePasswordForm />
    </div>
  )
}