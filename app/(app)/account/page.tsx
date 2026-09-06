// app/account/page.tsx
import { redirect } from "next/navigation"
import { currentUser } from "@/lib/session"
import { ChangePasswordForm } from "./account-form"
import { PageHeader } from "@/components/ui/page-header"

export const dynamic = "force-dynamic"

export default async function AccountPage() {
  const me = await currentUser()
  if (!me) redirect("/login")
  return (
    <div className="space-y-6">
      <PageHeader title="My account" />
      <p>{me.email} · role: <b>{me.role}</b></p>
      <ChangePasswordForm />
    </div>
  )
}