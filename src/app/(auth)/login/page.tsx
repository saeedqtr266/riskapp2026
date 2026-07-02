import { ShieldCheck } from "lucide-react"
import { signInAction } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  return (
    <main className="grid min-h-dvh bg-slate-50 lg:grid-cols-[1fr_520px]">
      <section className="hidden flex-col justify-between bg-slate-950 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-lg bg-teal-500">
            <ShieldCheck />
          </div>
          <div>
            <p className="text-sm text-slate-300">Enterprise Risk</p>
            <h1 className="text-xl font-semibold">Risk Assessment System</h1>
          </div>
        </div>
        <div className="max-w-xl">
          <h2 className="text-4xl font-semibold leading-tight">Department risk capture, review, approval, and reporting in one secure workflow.</h2>
          <p className="mt-5 text-slate-300">
            Supabase Auth, PostgreSQL row-level security, role-based actions, audit events, dashboards, and formatted Excel exports.
          </p>
        </div>
      </section>
      <section className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={signInAction}>
              <FieldGroup>
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <Input name="email" type="email" placeholder="admin@example.gov" required />
                </Field>
                <Field>
                  <FieldLabel>Password</FieldLabel>
                  <Input name="password" type="password" required />
                </Field>
                {params.error ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {params.error === "profile" ? "User profile was not found." : params.error}
                  </p>
                ) : null}
                <Button type="submit" className="w-full">Sign in</Button>
              </FieldGroup>
            </form>
            <div className="mt-6 rounded-lg bg-slate-50 p-4 text-xs text-slate-600">
              Seed users are listed in the README after running the Supabase seed script.
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
