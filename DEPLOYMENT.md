# GitHub and Vercel Deployment Checklist

## GitHub

Commit and push the contents of this `risk-register-mvp` folder as the repository root.

Recommended branch: `main`

## Vercel Project Settings

Vercel should auto-detect Next.js.

- Framework Preset: Next.js
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `.next`
- Node.js Version: 20.x or newer

## Database

Use Neon Postgres from the Vercel Marketplace.

1. In Vercel, open the project.
2. Add Storage -> Neon Postgres.
3. Connect the database to the project.
4. Confirm Vercel injects `DATABASE_URL` or `POSTGRES_URL`.

## Environment Variables

Add one of these in Vercel Project Settings -> Environment Variables for Production and Preview if the Marketplace does not inject it automatically:

```text
DATABASE_URL
```

or

```text
POSTGRES_URL
```

## Schema and Seed

Before using the deployed app:

1. Run `database/schema.sql` against the Neon database.
2. Run `npm run seed` locally against the same database, or create users manually.

Sample seeded password:

```text
RiskMVP!2026
```

## Smoke Test After Deploy

1. Open the Vercel URL.
2. Sign in as `admin@example.gov`.
3. Confirm `/dashboard` loads.
4. Open `/risks`, create a risk, submit it, and export from `/reports`.
