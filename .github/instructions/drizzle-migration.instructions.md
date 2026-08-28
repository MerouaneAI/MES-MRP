---
applyTo: "db/schema/**/*.ts"
---
# Drizzle schema + migration recipe
- One file per domain area under db/schema/. Export tables and enums.
- snake_case column names via the string arg; camelCase TS keys.
- Add indexes for columns used in WHERE/ORDER BY (e.g. expires_at, foreign keys).
- After editing schema: run `npm run db:generate` then `npm run db:migrate`.
- Never hand-edit generated migration SQL unless fixing a genuine error.