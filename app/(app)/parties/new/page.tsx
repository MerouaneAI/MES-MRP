import { createParty } from "@/app/actions/parties"
import { PartyForm } from "../party-form"
import { PageHeader } from "@/components/ui/page-header"

export default function NewPartyPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Add party" />
      <PartyForm action={createParty} submitLabel="Create party" />
    </div>
  )
}
