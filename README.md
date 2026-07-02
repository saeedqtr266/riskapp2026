# Enterprise Risk Register MVP

Production-ready MVP for the Risk Assessment and Risk Register Management System described in the PDF. It uses Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Supabase Auth, Supabase PostgreSQL with RLS, Recharts, and ExcelJS.

## Features

- Supabase email/password authentication.
- Role-based access for Department User, Department Manager, Strategy Team, and System Admin.
- Department-scoped RLS in PostgreSQL.
- Risk form with automatic inherent and residual score/level calculations.
- Workflow: draft -> manager review -> strategy review -> official risk -> final approved, with return paths.
- Dashboard KPIs, charts, pending review counts, and recent risk table.
- Department risk register and all-risk register depending on role.
- Review page with comments and workflow history.
- Reports page with formatted `.xlsx` export for all departments or one department.
- Admin page for users, departments, categories, scoring settings, and audit log review.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create a Supabase project and copy `.env.example` to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

3. In Supabase SQL Editor, run:

```sql
-- paste supabase/schema.sql
```

4. Seed auth users, profiles, departments, categories, risks, and workflow events:

```bash
npm run seed
```

Seed password for all sample users:

```text
RiskMVP!2026
```

Sample accounts:

- `department.user@example.gov` - Department User
- `department.manager@example.gov` - Department Manager
- `strategy@example.gov` - Strategy Team
- `admin@example.gov` - System Admin

5. Start locally:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Deployment to Vercel

1. Push this project to GitHub.
2. Import the repository in Vercel.
3. Set these Vercel environment variables for Production and Preview:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy.
5. Run `npm run seed` locally against the same Supabase project, or create equivalent users through a secure admin process.

## Database

The schema is in `supabase/schema.sql`. It includes:

- `departments`
- `risk_categories`
- `profiles`
- `risks`
- `risk_workflow_events`
- Postgres enums for roles, workflow statuses, and risk levels
- RLS policies for department scoping and admin/strategy access
- Indexes for workflow, department, residual level, target date, and audit history queries

## Notes

The app uses real Supabase Auth and database access. Seed data is clearly marked as seed data and is created through the service role script.
