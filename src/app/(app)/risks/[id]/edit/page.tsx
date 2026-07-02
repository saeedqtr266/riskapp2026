import { updateRiskAction } from "@/lib/actions"
import { getLookups, getRisk } from "@/lib/data"
import { RiskForm } from "@/components/risk/risk-form"

export default async function EditRiskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [risk, lookups] = await Promise.all([getRisk(id), getLookups()])
  const action = updateRiskAction.bind(null, id)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold">Edit {risk.risk_code}</h1>
        <p className="text-sm text-slate-500">Changes are permission-gated by department, role, and workflow status.</p>
      </div>
      <RiskForm risk={risk} {...lookups} action={action} />
    </div>
  )
}
