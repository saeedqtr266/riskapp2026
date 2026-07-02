import { requireProfile } from "@/lib/data"
import { canManageAdmin, roleLabels } from "@/lib/risk/calculations"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default async function AdminPage() {
  const { supabase, profile } = await requireProfile()
  if (!canManageAdmin(profile.role)) redirect("/dashboard")

  const [departments, categories, users, audit] = await Promise.all([
    supabase.from("departments").select("*").order("name"),
    supabase.from("risk_categories").select("*").order("name"),
    supabase.from("profiles").select("*, department:departments(name)").order("full_name"),
    supabase.from("risk_workflow_events").select("*, actor:profiles(full_name)").order("created_at", { ascending: false }).limit(25),
  ])

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold">Administration</h1>
        <p className="text-sm text-slate-500">Manage users, departments, categories, scoring settings, and audit logs.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Departments</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {(departments.data ?? []).map((department) => (
              <div key={department.id} className="rounded-lg border border-slate-200 p-3">{department.name} ({department.code})</div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Risk categories</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {(categories.data ?? []).map((category) => (
              <div key={category.id} className="rounded-lg border border-slate-200 p-3">{category.name}</div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Likelihood and impact settings</CardTitle></CardHeader>
          <CardContent className="text-sm text-slate-600">
            Scores use a 5x5 matrix. Levels are Low 1-4, Medium 5-9, High 10-15, Critical 16-25.
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Users and roles</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Department</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {(users.data ?? []).map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{roleLabels[user.role as keyof typeof roleLabels]}</TableCell>
                  <TableCell>{user.department?.name ?? "All"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Audit log</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          {(audit.data ?? []).map((event) => (
            <div key={event.id} className="rounded-lg border border-slate-200 p-3">
              {event.actor?.full_name ?? "System"} moved a risk from {event.from_status ?? "new"} to {event.to_status}
              <span className="block text-xs text-slate-500">{new Date(event.created_at).toLocaleString()}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
