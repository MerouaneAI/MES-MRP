// app/account/page.tsx
import { redirect } from "next/navigation"
import { currentUser } from "@/lib/session"
import { ChangePasswordForm } from "./account-form"
import { Nav } from "@/components/nav"

export const dynamic = "force-dynamic"

export default async function AccountPage() {
  const me = await currentUser()
  if (!me) redirect("/login")
  return (
    <main style={{ padding: 24 }}>
      <Nav />
      <h1>My account</h1>
      <p>{me.email} · role: <b>{me.role}</b></p>
      <ChangePasswordForm />
    </main>
  )
}