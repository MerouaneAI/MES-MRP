import { authorize, type SessionUser } from "@/lib/authz"

export async function currentUser(): Promise<SessionUser | null> {
  const gate = await authorize("viewer")
  return gate.ok ? gate.user : null
}