import { createParty } from "@/app/actions/parties"
import { PartyForm } from "../party-form"

export default function NewPartyPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Add party</h1>
      <PartyForm action={createParty} submitLabel="Create party" />
    </main>
  )
}
