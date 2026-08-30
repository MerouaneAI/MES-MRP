import Link from "next/link"
import { desc } from "drizzle-orm"
import { db } from "@/db"
import { parties } from "@/db/schema/parties"
import { deleteParty } from "@/app/actions/parties"
import { signOut } from "@/auth"

export const dynamic = "force-dynamic"

export default async function PartiesPage() {
  const rows = await db.select().from(parties).orderBy(desc(parties.createdAt))

  return (
    <main style={{ padding: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Parties</h1>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/parties/new">+ Add party</Link>
          <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }) }}>
            <button type="submit">Sign out</button>
          </form>
        </div>
      </header>

      {rows.length === 0 ? (
        <p>No parties yet. Add your first one.</p>
      ) : (
        <table cellPadding={8} style={{ borderCollapse: "collapse", marginTop: 16 }}>
          <thead>
            <tr>
              <th align="left">Name</th><th align="left">Type</th>
              <th align="left">Phone</th><th align="left">NIF</th><th />
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} style={{ borderTop: "1px solid #ddd" }}>
                <td>{p.name}</td>
                <td>{p.type}</td>
                <td>{p.phone ?? "—"}</td>
                <td>{p.nif ?? "—"}</td>
                <td style={{ display: "flex", gap: 8 }}>
                  <Link href={`/parties/${p.id}/edit`}>Edit</Link>
                  <form action={deleteParty}>
                    <input type="hidden" name="id" value={p.id} />
                    <button type="submit">Delete</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}
