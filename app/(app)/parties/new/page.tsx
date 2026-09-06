import { createParty } from "@/app/actions/parties"
import { PartyForm } from "../party-form"

export default function NewPartyPage() {
  return (
    <div className="space-y-6">
      <h1>Add party</h1>
      <PartyForm action={createParty} submitLabel="Create party" />
    </div>
  )
}
