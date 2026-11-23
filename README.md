# Ledgerly

A focused personal asset-tracking dashboard built with Next.js, Turso, Drizzle ORM, better-auth, shadcn/ui conventions, Tailwind CSS, and Manrope.

## Run locally

```bash
pnpm install
cp .env.example .env.local   # then fill in the values below
pnpm db:migrate
pnpm dev
```

The development server runs at [http://localhost:4100](http://localhost:4100).

### Environment

| Variable | Purpose |
| --- | --- |
| `TURSO_DATABASE_URL` | libSQL URL of the Turso database |
| `TURSO_AUTH_TOKEN` | Turso auth token |
| `BETTER_AUTH_SECRET` | Random 32-byte secret for better-auth |
| `BETTER_AUTH_URL` | Base URL of the app, e.g. `http://localhost:4100` |

Turso credentials are required — the app and `drizzle.config.ts` fail at startup without them.

## Accounts

Sign-up is disabled. Accounts are created outside the app and sign in with a username and a temporary password. On first sign-in the user must set a new password at `/reset-password` before reaching the portfolio.

A signed-in user with no assets sees a demo portfolio until they add their first holding.

## Database

The schema is defined in `db/schema.ts` and managed with Drizzle migrations in `drizzle/`.

```bash
pnpm db:generate   # create a migration from schema changes
pnpm db:migrate    # apply pending migrations
pnpm db:studio     # browse the database
```

Main tables: `assets`, `asset_group`, `asset_group_value_transaction`, `portfolio_snapshot`, `dividend_transaction`, `currency_settings`, plus the better-auth tables (`user`, `session`, `account`, `verification`).
