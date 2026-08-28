---
applyTo: "app/actions/**/*.ts"
---
# Server Action recipe
Every file here must:
1. Start with "use server".
2. Verify the session with `auth()` and reject if unauthenticated.
3. Define a Zod schema for the input and parse it first.
4. Wrap multi-row/multi-table writes in `db.transaction(...)`.
5. Return `{ ok: true, data }` or `{ ok: false, error }` — never throw to the client.
6. Call `revalidatePath(...)` for the affected list page.