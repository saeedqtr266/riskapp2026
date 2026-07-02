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

## Environment Variables

Add these in Vercel Project Settings -> Environment Variables for Production and Preview:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

`SUPABASE_SERVICE_ROLE_KEY` is required only for seed/admin scripts. Keep it secret and never expose it client-side.

## Supabase

Before using the deployed app:

1. Run `supabase/schema.sql` in the Supabase SQL Editor.
2. Add the Vercel deployment URL to Supabase Auth redirect URLs.
3. Run `npm run seed` locally against the same Supabase project, or create users manually.

Sample seeded password:

```text
RiskMVP!2026
```

## Smoke Test After Deploy

1. Open the Vercel URL.
2. Sign in as `admin@example.gov`.
3. Confirm `/dashboard` loads.
4. Open `/risks`, create a risk, submit it, and export from `/reports`.
