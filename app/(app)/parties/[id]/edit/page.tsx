import { notFound } from "next/navigation"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { parties } from "@/db/schema/parties"
import { updateParty } from "@/app/actions/parties"
import { PartyForm } from "../../party-form"
import { PageHeader } from "@/components/ui/page-header"

export default async function EditPartyPage({
  params,
}: {
  params: Promise<{ id: string }> // Next 14: { id: string } (no Promise, no await)
}) {
  const { id } = await params
  const [party] = await db.select().from(parties).where(eq(parties.id, id))
  if (!party) notFound()

  const action = updateParty.bind(null, party.id) // → (state, formData) shape

  return (
    <div className="space-y-6">
      <PageHeader title="Edit party" />
      <PartyForm
        action={action}
        submitLabel="Save changes"
        defaults={{
          type: party.type,
          name: party.name,
          phone: party.phone ?? "",
          address: party.address ?? "",
          nif: party.nif ?? "",
          nis: party.nis ?? "",
          rc: party.rc ?? "",
          ai: party.ai ?? "",
        }}
      />
    </div>
  )
}
