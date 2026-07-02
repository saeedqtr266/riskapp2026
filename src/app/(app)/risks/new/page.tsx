import { createRiskAction } from "@/lib/actions"
import { getLookups } from "@/lib/data"
import { RiskForm } from "@/components/risk/risk-form"

export default async function NewRiskPage() {
  const lookups = await getLookups()
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold">Add risk</h1>
        <p className="text-sm text-slate-500">Create a draft or submit directly to the department manager.</p>
      </div>
      <RiskForm {...lookups} action={createRiskAction} />
    </div>
  )
}
