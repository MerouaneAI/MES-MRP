import { createParty } from "@/app/actions/parties"
import { PartyForm } from "../party-form"
import { Nav } from "@/components/nav"

export default function NewPartyPage() {
  return (
    <main style={{ padding: 24 }}>
      <Nav />
      <h1>Add party</h1>
      <PartyForm action={createParty} submitLabel="Create party" />
    </main>
  )
}
