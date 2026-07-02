import { AlertTriangle, CheckCircle2, Clock3, FileWarning } from "lucide-react"
import { DashboardCharts } from "@/components/dashboard/dashboard-charts"
import { RiskTable } from "@/components/risk/risk-table"
import { getRisks } from "@/lib/data"
import { statusLabels } from "@/lib/risk/calculations"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function countBy<T extends string>(items: T[]) {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] ?? 0) + 1
    return acc
  }, {})
}

export default async function DashboardPage() {
  const risks = await getRisks()
  const today = new Date().toISOString().slice(0, 10)
  const highCritical = risks.filter((risk) => risk.residual_level === "High" || risk.residual_level === "Critical")
  const overdue = risks.filter(
    (risk) => risk.target_completion_date && risk.target_completion_date < today && risk.status !== "final_approved"
  )
  const managerPending = risks.filter((risk) => risk.status === "submitted_to_manager")
  const strategyPending = risks.filter((risk) => risk.status === "under_strategy_review")
  const official = risks.filter((risk) => risk.status === "final_approved")

  const byDepartment = Object.entries(countBy(risks.map((risk) => risk.departments?.name ?? "Unassigned"))).map(
    ([name, total]) => ({ name, total })
  )
  const byStatus = Object.entries(countBy(risks.map((risk) => statusLabels[risk.status]))).map(([name, total]) => ({
    name,
    total,
  }))
  const byLevel = Object.entries(countBy(risks.map((risk) => risk.residual_level))).map(([name, total]) => ({
    name,
    total,
  }))

  const kpis = [
    { label: "Total risks", value: risks.length, icon: FileWarning },
    { label: "High and critical", value: highCritical.length, icon: AlertTriangle },
    { label: "Overdue actions", value: overdue.length, icon: Clock3 },
    { label: "Final approved", value: official.length, icon: CheckCircle2 },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-slate-500">Operational risk posture, pending reviews, and mitigation progress.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-slate-500">{kpi.label}</CardTitle>
              <kpi.icon className="text-slate-400" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm">Pending department reviews</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold">{managerPending.length}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Pending Strategy Team reviews</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold">{strategyPending.length}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Department submission progress</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold">
            {risks.length ? Math.round(((risks.length - managerPending.length) / risks.length) * 100) : 0}%
          </CardContent>
        </Card>
      </div>
      <DashboardCharts byDepartment={byDepartment} byStatus={byStatus} byLevel={byLevel} />
      <section>
        <h2 className="mb-3 text-lg font-semibold">Recent risks</h2>
        <RiskTable risks={risks.slice(0, 8)} />
      </section>
    </div>
  )
}
