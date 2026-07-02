import Link from "next/link"
import { Plus } from "lucide-react"
import { RiskTable } from "@/components/risk/risk-table"
import { Button } from "@/components/ui/button"
import { getRisks, requireProfile } from "@/lib/data"
import { canSeeAllDepartments } from "@/lib/risk/calculations"

export default async function RisksPage() {
  const [{ profile }, risks] = await Promise.all([requireProfile(), getRisks()])
  const allDepartments = canSeeAllDepartments(profile.role)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-semibold">{allDepartments ? "All Risks" : "My Department Risks"}</h1>
          <p className="text-sm text-slate-500">
            Search, filter, edit, submit, review, and track workflow status.
          </p>
        </div>
        <Link href="/risks/new">
          <Button>
            <Plus data-icon="inline-start" />
            Add new risk
          </Button>
        </Link>
      </div>
      <RiskTable risks={risks} showDepartment={allDepartments} />
    </div>
  )
}
