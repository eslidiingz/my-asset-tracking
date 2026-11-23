# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Ledgerly: a private personal asset-tracking dashboard. Next.js 15 App Router + React 19, Drizzle ORM on Turso (libSQL/SQLite), better-auth, Tailwind CSS v4. Package manager is pnpm.

## Commands

```bash
pnpm dev                     # next dev --turbopack on http://localhost:4100
pnpm db:generate             # drizzle-kit generate (diff db/schema.ts -> new SQL in drizzle/)
pnpm db:migrate              # apply pending migrations to the Turso DB in .env.local
pnpm db:check
pnpm db:studio
pnpm exec tsc --noEmit       # type check
pnpm tsx scripts/<name>.ts   # one-off data scripts (read .env.local)
```

- Per AGENTS.md: do **not** run `pnpm lint` or `pnpm build` for routine verification — only when the user explicitly asks.
- There is no test suite.

## Environment

`.env.local` (template in `.env.example`) needs `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`. `db/index.ts` and `drizzle.config.ts` throw at import time if the Turso vars are missing.

The README is out of date: it says the app falls back to a demo portfolio without Turso credentials and auto-creates an `assets` table. Neither is true now — credentials are required and the schema is managed by Drizzle migrations. The only demo fallbacks are per-user: `getAssets` returns hardcoded demo assets when a user has zero assets, and `getPortfolioGrowth` returns demo series when there are fewer than 2 snapshots.

## Architecture

**Request flow.** There is no middleware. Every page (`app/**/page.tsx`) is an async server component with `export const dynamic = "force-dynamic"` that:
1. calls `auth.api.getSession({ headers: await headers() })`,
2. redirects to `/login` if no session and to `/reset-password` if `session.user.mustChangePassword`,
3. loads data in parallel via `lib/db.ts` getters (all scoped by `session.user.id`),
4. renders `Sidebar` / `Header` / `MobileNav` around a feature component.

New pages should follow the same guard. Server → client props convert `Date` fields to ISO strings.

**Reads vs writes.**
- Reads: `lib/db.ts` (assets, groups, group-value transactions, currency settings, dividends) and `lib/portfolio.ts` (growth series from `portfolio_snapshot`).
- Writes: server actions in `app/actions/assets.ts` (assets, groups, group-value transactions, dividends) and `app/actions/settings.ts` (USD→THB rate). Each action re-checks the session (and `mustChangePassword`), validates input with zod, scopes every `where` by `userId` (and verifies ownership of referenced group IDs), then calls `revalidatePath` for every affected route. Actions return `{ error, success }`; client dialogs consume it (form dialogs via `useActionState`) and report results with `showToast` from `components/ui/toast-provider.tsx`.

**Auth** (`lib/auth.ts`, `lib/auth-client.ts`, `app/api/auth/[...all]/route.ts`): better-auth with the Drizzle adapter (sqlite), username plugin, email/password sign-up **disabled** — accounts are provisioned out of band. Users start with `mustChangePassword = true`; `app/reset-password/actions.ts` changes the password and clears the flag. Cookie prefix `ledgerly`.

**Database** (`db/schema.ts` is the single source of truth for tables and inferred types): better-auth tables (`user`, `session`, `account`, `verification`) plus app tables `assets`, `asset_group`, `asset_group_value_transaction`, `portfolio_snapshot`, `currency_settings`, `dividend_transaction`. All app rows carry `user_id` with cascade delete.
- Migrations live in `drizzle/` with `drizzle/meta/_journal.json`. Some migrations (`0011`, `0015`, `0016`) were hand-written and have no matching `meta/*_snapshot.json` (latest snapshot is `0014`), so `db:generate` may re-emit those changes — review generated SQL before migrating.
- `db/index.ts` exports both `db` (Drizzle) and the raw libSQL `client`; `updateAssetGroupValues` uses `client.batch` with raw SQL for bulk inserts.

**Domain rules:**
- Asset value/cost = `totalCost ?? units * averagePrice` (used for ordering and snapshots). Adding/updating an asset appends a `portfolio_snapshot` row with the recomputed total.
- The asset category enum is duplicated in `db/schema.ts` and the zod schema in `app/actions/assets.ts` — change both. Only `Stocks` and `TSD` keep `dividendYield`; `Private Fund` may have 0 units.
- Currency: Stocks/Crypto are priced in USD; `Mutual Fund`, `Private Fund`, `TSD` in THB (logic in the add/edit asset dialogs). Group-value transactions are THB. Dividends store `currency` (`USD` | `THB`). THB totals use the per-user `currency_settings.usdToThbRate`, refreshed from the Frankfurter API in `app/actions/settings.ts`.
- Date-only inputs (`YYYY-MM-DD`) are stored as `new Date(`${date}T12:00:00`)` to avoid timezone day shifts.
- Symbols are upper-cased on write.

**Scripts** (`scripts/*.ts`): one-off data imports/cleanups run with `tsx`. They load `.env.local` via dotenv and then dynamically `import("@/db")` (a static import would throw before env is loaded). `remove-placeholder-stocks.ts` asserts exactly one user exists.

## UI conventions

- Tailwind v4 with no `tailwind.config`; theme tokens (`--color-accent`, `--color-muted`, `--color-line`, …) and many custom component classes (`bento-card`, `asset-dialog`, `auth-field`, `label`, `eyebrow`, …) are defined in `app/globals.css`. Reuse them rather than inventing new styles.
- shadcn config in `components.json` (style `base-nova`, aliases `@/components`, `@/components/ui`, `@/lib/utils`) with an extra `@beui` registry. Dialogs use Radix (`@radix-ui/react-dialog`); animated tabs in `components/motion/tabs.tsx` use `motion`.
- Path alias `@/*` → repo root.
