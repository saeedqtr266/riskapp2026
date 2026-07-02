import Link from "next/link"
import { Download } from "lucide-react"
import { getLookups, getRisks } from "@/lib/data"
import { levelClass } from "@/lib/risk/calculations"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ReportsPage() {
  const [risks, { departments }] = await Promise.all([getRisks(), getLookups()])
  const highCritical = risks.filter((risk) => risk.residual_level === "High" || risk.residual_level === "Critical")
  const today = new Date().toISOString().slice(0, 10)
  const overdue = risks.filter((risk) => risk.target_completion_date && risk.target_completion_date < today)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-slate-500">Generate department, enterprise, high-risk, and overdue action reports.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Risk register export</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link href="/api/export">
              <Button>
                <Download data-icon="inline-start" />
                Export all departments (.xlsx)
              </Button>
            </Link>
            <div className="grid gap-2 md:grid-cols-2">
              {departments.map((department) => (
                <Link key={department.id} href={`/api/export?department=${department.id}`}>
                  <Button variant="outline" className="w-full justify-start">
                    <Download data-icon="inline-start" />
                    {department.name}
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Report summary</CardTitle></CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <p>Total risks: <span className="font-semibold">{risks.length}</span></p>
            <p>High and critical risks: <span className="font-semibold">{highCritical.length}</span></p>
            <p>Overdue mitigation actions: <span className="font-semibold">{overdue.length}</span></p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>High and critical risks</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-2">
          {highCritical.map((risk) => (
            <div key={risk.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
              <div>
                <p className="font-medium">{risk.risk_code} - {risk.title}</p>
                <p className="text-sm text-slate-500">{risk.departments?.name}</p>
              </div>
              <Badge variant="outline" className={levelClass(risk.residual_level)}>
                {risk.residual_score} {risk.residual_level}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
