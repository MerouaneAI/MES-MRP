"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ALL_PAGES, PAGE_LABELS, FILTERABLE_PAGES, type PageKey } from "@/lib/roles"
import { updateRolePermissions, deleteRole } from "@/app/actions/roles"
import { Card, Table, THead, TH, TBody, TR, TD, Button } from "@/components/ui"

type PermState = {
  canView: boolean
  canWrite: boolean
  canDelete: boolean
  dataFilter: Record<string, string[]> | null
}

export function RolePermissionsForm({
  role,
  permissions,
  canWrite,
}: {
  role: { id: string; name: string; isBuiltin: boolean }
  permissions: { page: string; canView: boolean; canWrite: boolean; canDelete: boolean; dataFilter?: Record<string, string[]> | null }[]
  canWrite: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  // Initialize state from existing permissions
  const [state, setState] = useState<Record<PageKey, PermState>>(() => {
    const init: Record<PageKey, PermState> = {} as Record<PageKey, PermState>
    for (const p of ALL_PAGES) {
      const existing = permissions.find(x => x.page === p)
      init[p] = {
        canView: existing?.canView ?? false,
        canWrite: existing?.canWrite ?? false,
        canDelete: existing?.canDelete ?? false,
        dataFilter: existing?.dataFilter ?? null,
      }
    }
    return init
  })

  const handleChange = (page: PageKey, field: keyof PermState, value: boolean | Record<string, string[]> | null) => {
    setState(prev => ({
      ...prev,
      [page]: {
        ...prev[page],
        [field]: value
      }
    }))
  }

  const handleFilterToggle = (page: PageKey, filterKey: string, optionValue: string) => {
    setState(prev => {
      const currentFilter = prev[page].dataFilter || {}
      const currentValues = currentFilter[filterKey] || []
      
      let newValues
      if (currentValues.includes(optionValue)) {
        newValues = currentValues.filter((v: string) => v !== optionValue)
      } else {
        newValues = [...currentValues, optionValue]
      }

      // If empty array, we can just remove the key
      const newFilter = { ...currentFilter, [filterKey]: newValues }
      if (newValues.length === 0) delete newFilter[filterKey]

      return {
        ...prev,
        [page]: {
          ...prev[page],
          dataFilter: Object.keys(newFilter).length > 0 ? newFilter : null
        }
      }
    })
  }

  const handleSave = async () => {
    startTransition(async () => {
      const payload = Object.entries(state).map(([page, p]) => ({
        page, ...p
      }))
      const res = await updateRolePermissions(role.id, payload)
      if (res.success) {
        router.refresh()
      } else {
        alert(res.error)
      }
    })
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this role? This might fail if users are still assigned to it.")) return
    startTransition(async () => {
      const fd = new FormData()
      fd.append("roleId", role.id)
      const res = await deleteRole(fd)
      if (res.success) {
        router.push("/users")
      } else {
        alert(res.error)
      }
    })
  }

  const disabled = role.name === "admin" || !canWrite || isPending

  return (
    <Card className="p-2">
      <div className="overflow-x-auto">
        <Table>
          <THead>
            <TH>Page</TH>
            <TH>View</TH>
            <TH>Write / Edit</TH>
            <TH>Delete</TH>
            <TH>Data Filters</TH>
          </THead>
          <TBody>
            {ALL_PAGES.map(page => {
              const filters = FILTERABLE_PAGES[page]
              const pState = state[page]
              
              return (
                <TR key={page}>
                  <TD className="font-medium">{PAGE_LABELS[page]}</TD>
                  <TD>
                    <input type="checkbox" checked={pState.canView} disabled={disabled}
                      onChange={e => handleChange(page, "canView", e.target.checked)}
                      className="h-4 w-4 rounded border-line bg-surface text-gold focus:ring-gold focus:ring-offset-surface" />
                  </TD>
                  <TD>
                    <input type="checkbox" checked={pState.canWrite} disabled={disabled}
                      onChange={e => handleChange(page, "canWrite", e.target.checked)}
                      className="h-4 w-4 rounded border-line bg-surface text-gold focus:ring-gold focus:ring-offset-surface" />
                  </TD>
                  <TD>
                    <input type="checkbox" checked={pState.canDelete} disabled={disabled}
                      onChange={e => handleChange(page, "canDelete", e.target.checked)}
                      className="h-4 w-4 rounded border-line bg-surface text-gold focus:ring-gold focus:ring-offset-surface" />
                  </TD>
                  <TD>
                    {filters && pState.canView && (
                      <div className="flex flex-col gap-2">
                        {filters.map(f => (
                          <div key={f.key} className="text-sm">
                            <span className="text-ink-faint mr-2">{f.label}:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {f.options.map(opt => {
                                const active = pState.dataFilter?.[f.key]?.includes(opt.value)
                                return (
                                  <label key={opt.value} className="flex items-center gap-1">
                                    <input type="checkbox" checked={active || false} disabled={disabled}
                                      onChange={() => handleFilterToggle(page, f.key, opt.value)}
                                      className="h-3 w-3 rounded border-line bg-surface text-gold focus:ring-gold focus:ring-offset-surface" />
                                    <span>{opt.label}</span>
                                  </label>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {!filters && <span className="text-ink-faint text-sm">—</span>}
                  </TD>
                </TR>
              )
            })}
          </TBody>
        </Table>
      </div>

      <div className="flex justify-between items-center mt-6 p-4 border-t border-line">
        {!role.isBuiltin && canWrite ? (
          <Button variant="danger" size="sm" onClick={handleDelete} disabled={disabled}>Delete Role</Button>
        ) : (
          <div></div>
        )}
        <Button onClick={handleSave} disabled={disabled}>{isPending ? "Saving..." : "Save Permissions"}</Button>
      </div>
    </Card>
  )
}
