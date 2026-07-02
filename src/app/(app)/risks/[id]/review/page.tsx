import { workflowAction } from "@/lib/actions"
import { getRisk, getWorkflowEvents, requireProfile } from "@/lib/data"
import { levelClass, nextAllowedActions, statusLabels } from "@/lib/risk/calculations"
import type { WorkflowStatus } from "@/lib/risk/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

const actionLabels: Record<string, string> = {
  submit_to_manager: "Submit to Department Manager",
  submit_to_strategy: "Submit to Strategy Team",
  return_to_user: "Return to Department User",
  confirm_official: "Confirm as Official Risk",
  return_to_department: "Return to Department",
  final_approve: "Final Approve",
}

export default async function ReviewRiskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [{ profile }, risk, events] = await Promise.all([requireProfile(), getRisk(id), getWorkflowEvents(id)])
  const actions = nextAllowedActions(profile.role, risk.status)
  const runAction = workflowAction.bind(null, id)

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
      <section className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{risk.risk_code}: {risk.title}</h1>
          <p className="text-sm text-slate-500">{risk.departments?.name} / {risk.risk_categories?.name}</p>
        </div>
        <Card>
          <CardHeader><CardTitle>Risk summary</CardTitle></CardHeader>
          <CardContent className="grid gap-4 text-sm md:grid-cols-2">
            <div><p className="font-semibold">Description</p><p className="text-slate-600">{risk.description}</p></div>
            <div><p className="font-semibold">Causes</p><p className="text-slate-600">{risk.causes}</p></div>
            <div><p className="font-semibold">Consequences</p><p className="text-slate-600">{risk.consequences}</p></div>
            <div><p className="font-semibold">Controls</p><p className="text-slate-600">{risk.current_controls || risk.existing_controls}</p></div>
            <div>
              <p className="font-semibold">Inherent risk</p>
              <Badge variant="outline" className={levelClass(risk.inherent_level)}>{risk.inherent_score} {risk.inherent_level}</Badge>
            </div>
            <div>
              <p className="font-semibold">Residual risk</p>
              <Badge variant="outline" className={levelClass(risk.residual_level)}>{risk.residual_score} {risk.residual_level}</Badge>
            </div>
            <div className="md:col-span-2"><p className="font-semibold">Mitigation actions</p><p className="text-slate-600">{risk.mitigation_actions}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Workflow action</CardTitle></CardHeader>
          <CardContent>
            <p className="mb-3 text-sm">Current status: <span className="font-semibold">{statusLabels[risk.status]}</span></p>
            {actions.length ? (
              <form action={runAction} className="flex flex-col gap-3">
                <Textarea name="comments" placeholder="Add review comments" rows={4} />
                <div className="flex flex-wrap gap-2">
                  {actions.map((action) => (
                    <Button key={action} name="action" value={action}>{actionLabels[action]}</Button>
                  ))}
                </div>
              </form>
            ) : (
              <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No workflow actions are available for your role at this status.</p>
            )}
          </CardContent>
        </Card>
      </section>
      <aside>
        <Card>
          <CardHeader><CardTitle>Workflow history</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            {events.map((event) => (
              <div key={event.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                <p className="font-semibold">{statusLabels[event.to_status as WorkflowStatus]}</p>
                <p className="text-xs text-slate-500">{event.actor?.full_name ?? "System"} / {new Date(event.created_at).toLocaleString()}</p>
                {event.comments ? <p className="mt-2 text-slate-600">{event.comments}</p> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}
