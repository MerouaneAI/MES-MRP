// lib/roles.ts — client-safe role utilities (no server imports)
export type Role = "admin" | "operator" | "viewer"

const RANK: Record<Role, number> = { viewer: 0, operator: 1, admin: 2 }

export function can(role: Role, min: Role): boolean {
  return RANK[role] >= RANK[min]
}
