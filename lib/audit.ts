import { db } from "@/db"
import { auditLog } from "@/db/schema/audit"
import { FACILITY_ID } from "@/lib/constants"
import type { SessionUser } from "@/lib/authz"
import type { Tx } from "@/lib/mrp" // the transaction type you defined in Phase 4

export async function recordAudit(
  runner: typeof db | Tx,
  entry: {
    user?: Pick<SessionUser, "id" | "email"> | null
    action: string
    entity: string
    entityId?: string
    summary?: string
    metadata?: Record<string, unknown>
  },
): Promise<void> {
  await runner.insert(auditLog).values({
    facilityId: FACILITY_ID,
    userId: entry.user?.id ?? null,
    userEmail: entry.user?.email ?? null,
    action: entry.action,
    entity: entry.entity,
    entityId: entry.entityId ?? null,
    summary: entry.summary ?? null,
    metadata: entry.metadata ?? null,
  })
}