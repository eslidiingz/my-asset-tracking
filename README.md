# Ledgerly

A focused personal asset-tracking dashboard built with Next.js, Turso, shadcn/ui conventions, Tailwind CSS, and Manrope.

## Run locally

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

The development server runs at [http://localhost:4100](http://localhost:4100).

Without Turso credentials the app uses a built-in demo portfolio. With credentials present, it creates the `assets` table automatically and reads live holdings from it.

## Turso schema

The app creates this table on first connection:

```sql
CREATE TABLE assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  units REAL NOT NULL,
  price REAL NOT NULL,
  change REAL NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#62715d'
);
```
