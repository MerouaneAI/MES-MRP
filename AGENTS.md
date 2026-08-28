# Agent instructions

This repo's full conventions live in `.github/copilot-instructions.md`.
Read that file first and follow every rule in it before writing code.

Key reminders:
- Server Actions + Zod for all mutations. DZD only. English-only UI. Single factory.
- Auth = NextAuth v5 Credentials + JWT + bcrypt. No OAuth. Roles: admin/operator/viewer.
- Never simplify: gapless invoice numbering, lot-based quantity, lot genealogy, FEFO.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
