import Link from "next/link"
import { Database, FileCode2, KeyRound, PlayCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function SetupPage() {
  const steps = [
    {
      icon: KeyRound,
      title: "Add environment variables",
      body: "Create a Vercel Marketplace Neon Postgres database, then set DATABASE_URL locally and in Vercel.",
    },
    {
      icon: Database,
      title: "Create database objects",
      body: "Run database/schema.sql against the Vercel/Neon Postgres database to create tables, indexes, and constraints.",
    },
    {
      icon: FileCode2,
      title: "Seed test data",
      body: "Run npm run seed to create departments, roles, sample users, risks, and workflow history.",
    },
    {
      icon: PlayCircle,
      title: "Restart the dev server",
      body: "Restart npm run dev after changing .env.local so Next.js loads the new environment values.",
    },
  ]

  return (
    <main className="min-h-dvh bg-slate-50 p-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 py-12">
        <div>
          <h1 className="text-3xl font-semibold text-slate-950">Database setup required</h1>
          <p className="mt-2 text-slate-600">
            The app is running, but the dashboard needs a Vercel Postgres/Neon database before protected pages can load.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {steps.map((step) => (
            <Card key={step.title}>
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="grid size-10 place-items-center rounded-lg bg-teal-50 text-teal-700">
                  <step.icon />
                </div>
                <CardTitle className="text-base">{step.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">{step.body}</CardContent>
            </Card>
          ))}
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold">Expected local files</p>
          <pre className="mt-3 overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">
{`risk-register-mvp/.env.local
risk-register-mvp/database/schema.sql
risk-register-mvp/scripts/seed.mjs`}
          </pre>
        </div>
        <div>
          <Link href="/login">
            <Button variant="outline">Back to sign in</Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
