// components/shell/app-shell.tsx  (server component)
import { redirect } from "next/navigation"
import { currentUser } from "@/lib/session"
import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await currentUser()
  if (!user) redirect("/login")
  const safeUser = { email: user.email, role: user.role }
  return (
    <div className="flex min-h-screen">
      <Sidebar role={user.role} user={safeUser} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar role={user.role} user={safeUser} />
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}