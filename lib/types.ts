// Reusable across every module in Phase 3+.
export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> }

export type PartyFormState = ActionResult | null
