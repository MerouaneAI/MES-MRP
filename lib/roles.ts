// lib/roles.ts — client-safe role utilities (no server imports)

// Every navigable page in the app
export type PageKey =
  | "dashboard" | "parties" | "items" | "lots" | "purchasing"
  | "invoices" | "boms" | "work-orders" | "shopfloor"
  | "documents" | "eco" | "users" | "audit" | "account"

export const ALL_PAGES: PageKey[] = [
  "dashboard", "parties", "items", "lots", "purchasing",
  "invoices", "boms", "work-orders", "shopfloor",
  "documents", "eco", "users", "audit", "account",
]

// Pages that support data-level filtering
export const FILTERABLE_PAGES: Record<string, { label: string; key: string; options: { label: string; value: string }[] }[]> = {
  parties: [
    { label: "Party Type", key: "partyType", options: [
      { label: "Customer", value: "customer" },
      { label: "Supplier", value: "supplier" },
    ]},
  ],
  items: [
    { label: "Item Kind", key: "itemKind", options: [
      { label: "Raw Material", value: "raw_material" },
      { label: "Finished Good", value: "finished_good" },
    ]},
  ],
  lots: [
    { label: "Item Kind", key: "itemKind", options: [
      { label: "Raw Material", value: "raw_material" },
      { label: "Finished Good", value: "finished_good" },
    ]},
  ],
  invoices: [
    { label: "Status", key: "invoiceStatus", options: [
      { label: "Draft", value: "draft" },
      { label: "Issued", value: "issued" },
      { label: "Delivered", value: "delivered" },
      { label: "Returned", value: "returned" },
    ]},
  ],
}

export type Permission = {
  canView: boolean
  canWrite: boolean
  canDelete: boolean
  dataFilter?: Record<string, string[]> | null
}

export type PermissionMap = Partial<Record<PageKey, Permission>>

// Human-friendly page labels
export const PAGE_LABELS: Record<PageKey, string> = {
  dashboard: "Dashboard",
  parties: "Parties",
  items: "Items",
  lots: "Inventory",
  purchasing: "Purchasing",
  invoices: "Invoices",
  boms: "BOMs",
  "work-orders": "Work Orders",
  shopfloor: "Shop Floor",
  documents: "Documents",
  eco: "ECOs",
  users: "Users",
  audit: "Audit",
  account: "Account",
}

// Simple helper: check if a permission map grants access
export function canAccess(permissions: PermissionMap | undefined, page: PageKey, action: "view" | "write" | "delete" = "view"): boolean {
  if (!permissions) return false
  const perm = permissions[page]
  if (!perm) return false
  if (action === "view") return perm.canView
  if (action === "write") return perm.canWrite
  return perm.canDelete
}
