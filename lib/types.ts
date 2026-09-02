export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> }

// Reusable across every Phase 3 form.
export type FormState = ActionResult | null

export type ScanResult =
  | { ok: false; error: string }
  | { ok: true; kind: "lot" | "item"; title: string; detail: string }