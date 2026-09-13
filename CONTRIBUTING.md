# Contributing to AurumMES

Thank you for your interest in contributing! Here's how to get started.

## Development Setup

1. Fork and clone the repo
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and configure your database
4. Run migrations: `npm run db:migrate`
5. Seed data: `npm run db:seed`
6. Start dev server: `npm run dev`

## Code Style

- **TypeScript** is required for all files
- **ESLint** — run `npm run lint` before committing
- **Server Actions + Zod** for all mutations (no raw API routes for writes)
- **Barrel imports** — import UI components from `@/components/ui`, not individual files
- All currency values are in **DZD** (Algerian Dinar)
- **English-only** UI text

## Architecture Rules

- Auth: NextAuth v5 Credentials + JWT + bcrypt. No OAuth.
- Roles: `admin` / `operator` / `viewer` — enforce via `authorize()` in every server action
- Inventory: lot-based quantity tracking with FEFO consumption
- Invoices: gapless numbering per fiscal year (no gaps allowed)
- Single factory assumption (one `FACILITY_ID`)

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with clear, descriptive commits
3. Ensure all checks pass:
   ```bash
   npx tsc --noEmit    # Type check
   npm run lint         # Linting
   npm test             # Tests
   ```
4. Update documentation if you've changed public APIs
5. Open a PR with a clear description of what changed and why

## Reporting Bugs

Open an issue with:
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Browser and OS info

## Feature Requests

Open an issue tagged `enhancement` with:
- Problem description
- Proposed solution
- Alternative approaches considered

## Code of Conduct

Be respectful, inclusive, and constructive. We follow the [Contributor Covenant](https://www.contributor-covenant.org/).
