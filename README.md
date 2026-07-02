# Enterprise Risk Register MVP

Production-ready MVP for the Risk Assessment and Risk Register Management System described in the PDF. It uses Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Vercel Marketplace Neon Postgres, Recharts, and ExcelJS.

## Features

- Database-backed email/password authentication with bcrypt password hashes and HTTP-only session cookies.
- Role-based access for Department User, Department Manager, Strategy Team, and System Admin.
- Department-scoped access enforced in server-side queries and server actions.
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

2. Create a Vercel Marketplace Neon Postgres database and copy `.env.example` to `.env.local`:

```bash
DATABASE_URL=postgres://user:password@host/database?sslmode=require
```

Vercel may also provide `POSTGRES_URL`; the app accepts either `DATABASE_URL` or `POSTGRES_URL`.

3. Run the schema against the database:

```bash
# paste database/schema.sql into your Neon SQL editor, or run it with psql
```

4. Seed users, profiles, departments, categories, risks, and workflow events:

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
3. Add Neon Postgres from the Vercel Marketplace and connect it to this project.
4. Ensure Vercel has `DATABASE_URL` or `POSTGRES_URL` for Production and Preview.
5. Deploy.
6. Run `database/schema.sql` against the production database.
7. Run `npm run seed` locally against the same production database, or create users through a secure admin process.

## Database

The schema is in `database/schema.sql`. It includes:

- `departments`
- `risk_categories`
- `profiles`
- `app_sessions`
- `risks`
- `risk_workflow_events`
- Postgres enums for roles, workflow statuses, and risk levels
- Indexes for sessions, workflow, department, residual level, target date, and audit history queries

## Notes

The app uses real database-backed authentication and Postgres access. Seed data is clearly marked as seed data and can be replaced by production records.
