"use client"

import { useMemo, useState } from "react"
import { Save, Send } from "lucide-react"
import { calculateRisk } from "@/lib/risk/calculations"
import type { Category, Department, Profile, Risk } from "@/lib/risk/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type Action = (formData: FormData) => void | Promise<void>

export function RiskForm({
  risk,
  departments,
  categories,
  users,
  action,
}: {
  risk?: Risk
  departments: Department[]
  categories: Category[]
  users: Pick<Profile, "id" | "full_name" | "email" | "department_id">[]
  action: Action
}) {
  const [likelihood, setLikelihood] = useState(risk?.likelihood_score ?? 3)
  const [impact, setImpact] = useState(risk?.impact_score ?? 3)
  const [residualLikelihood, setResidualLikelihood] = useState(risk?.residual_likelihood_score ?? 2)
  const [residualImpact, setResidualImpact] = useState(risk?.residual_impact_score ?? 2)

  const inherent = useMemo(() => calculateRisk(likelihood, impact), [likelihood, impact])
  const residual = useMemo(
    () => calculateRisk(residualLikelihood, residualImpact),
    [residualLikelihood, residualImpact]
  )

  return (
    <form action={action} className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Risk details</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-4 lg:grid-cols-3">
              <Field>
                <FieldLabel>Department</FieldLabel>
                <select
                  name="department_id"
                  defaultValue={risk?.department_id}
                  required
                  className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
                >
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field>
                <FieldLabel>Category</FieldLabel>
                <select
                  name="category_id"
                  defaultValue={risk?.category_id}
                  required
                  className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field>
                <FieldLabel>Risk owner</FieldLabel>
                <select
                  name="owner_id"
                  defaultValue={risk?.owner_id ?? ""}
                  className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
                >
                  <option value="">Unassigned</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field>
              <FieldLabel>Risk title</FieldLabel>
              <Input name="title" defaultValue={risk?.title} required />
            </Field>
            <Field>
              <FieldLabel>Risk description</FieldLabel>
              <Textarea name="description" defaultValue={risk?.description} required rows={4} />
            </Field>
            <div className="grid gap-4 lg:grid-cols-2">
              <Field>
                <FieldLabel>Causes</FieldLabel>
                <Textarea name="causes" defaultValue={risk?.causes} required rows={3} />
              </Field>
              <Field>
                <FieldLabel>Consequences / impact</FieldLabel>
                <Textarea name="consequences" defaultValue={risk?.consequences} required rows={3} />
              </Field>
              <Field>
                <FieldLabel>Existing controls</FieldLabel>
                <Textarea name="existing_controls" defaultValue={risk?.existing_controls} rows={3} />
              </Field>
              <Field>
                <FieldLabel>Current controls</FieldLabel>
                <Textarea name="current_controls" defaultValue={risk?.current_controls} rows={3} />
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Risk scoring and mitigation</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-4 lg:grid-cols-4">
              <Field>
                <FieldLabel>Likelihood score</FieldLabel>
                <Input
                  name="likelihood_score"
                  type="number"
                  min={1}
                  max={5}
                  value={likelihood}
                  onChange={(event) => setLikelihood(Number(event.target.value))}
                  required
                />
              </Field>
              <Field>
                <FieldLabel>Impact score</FieldLabel>
                <Input
                  name="impact_score"
                  type="number"
                  min={1}
                  max={5}
                  value={impact}
                  onChange={(event) => setImpact(Number(event.target.value))}
                  required
                />
              </Field>
              <Field>
                <FieldLabel>Inherent risk score</FieldLabel>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold">
                  {inherent.score} - {inherent.level}
                </div>
              </Field>
              <Field>
                <FieldLabel>Residual risk score</FieldLabel>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold">
                  {residual.score} - {residual.level}
                </div>
              </Field>
              <Field>
                <FieldLabel>Residual likelihood</FieldLabel>
                <Input
                  name="residual_likelihood_score"
                  type="number"
                  min={1}
                  max={5}
                  value={residualLikelihood}
                  onChange={(event) => setResidualLikelihood(Number(event.target.value))}
                  required
                />
              </Field>
              <Field>
                <FieldLabel>Residual impact</FieldLabel>
                <Input
                  name="residual_impact_score"
                  type="number"
                  min={1}
                  max={5}
                  value={residualImpact}
                  onChange={(event) => setResidualImpact(Number(event.target.value))}
                  required
                />
              </Field>
              <Field>
                <FieldLabel>Action owner</FieldLabel>
                <Input name="action_owner" defaultValue={risk?.action_owner} />
              </Field>
              <Field>
                <FieldLabel>Target completion date</FieldLabel>
                <Input name="target_completion_date" type="date" defaultValue={risk?.target_completion_date ?? ""} />
              </Field>
            </div>
            <Field>
              <FieldLabel>Mitigation actions</FieldLabel>
              <Textarea name="mitigation_actions" defaultValue={risk?.mitigation_actions} rows={4} />
            </Field>
            <Field>
              <FieldLabel>Review comments</FieldLabel>
              <Textarea name="review_comments" defaultValue={risk?.review_comments ?? ""} rows={3} />
            </Field>
            <Field>
              <FieldLabel>Attachments</FieldLabel>
              <Textarea
                name="attachments"
                defaultValue={risk?.attachments?.join("\n") ?? ""}
                placeholder="One file URL or document reference per line"
                rows={3}
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="submit" variant="outline" name="intent" value="draft">
          <Save data-icon="inline-start" />
          Save draft
        </Button>
        {!risk ? (
          <Button type="submit" name="intent" value="submit">
            <Send data-icon="inline-start" />
            Save and submit
          </Button>
        ) : null}
      </div>
    </form>
  )
}
