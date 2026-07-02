"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { authenticateUser, createSession, destroyCurrentSession } from "@/lib/auth"
import { getSql } from "@/lib/db"
import { hasAppEnv } from "@/lib/env"
import { requireProfile } from "@/lib/data"
import {
  calculateRisk,
  canEditRisk,
  canSeeAllDepartments,
  transitionForAction,
} from "@/lib/risk/calculations"
import type { WorkflowStatus } from "@/lib/risk/types"

const riskSchema = z.object({
  department_id: z.string().uuid(),
  category_id: z.string().uuid(),
  owner_id: z.string().uuid().optional().or(z.literal("")),
  title: z.string().min(4),
  description: z.string().min(10),
  causes: z.string().min(3),
  consequences: z.string().min(3),
  existing_controls: z.string().optional().default(""),
  current_controls: z.string().optional().default(""),
  likelihood_score: z.coerce.number().min(1).max(5),
  impact_score: z.coerce.number().min(1).max(5),
  residual_likelihood_score: z.coerce.number().min(1).max(5),
  residual_impact_score: z.coerce.number().min(1).max(5),
  mitigation_actions: z.string().optional().default(""),
  action_owner: z.string().optional().default(""),
  target_completion_date: z.string().optional().or(z.literal("")),
  review_comments: z.string().optional().default(""),
  approval_status: z.string().optional().default("Draft"),
  attachments: z.string().optional().default(""),
})

function formToObject(formData: FormData) {
  return Object.fromEntries(formData.entries())
}

function parseAttachments(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

async function logEvent(
  riskId: string,
  fromStatus: WorkflowStatus | null,
  toStatus: WorkflowStatus,
  comments?: string
) {
  const { profile } = await requireProfile()
  const sql = getSql()
  await sql`
    insert into risk_workflow_events (risk_id, actor_id, from_status, to_status, comments)
    values (${riskId}, ${profile.id}, ${fromStatus}, ${toStatus}, ${comments || null})
  `
}

export async function signInAction(formData: FormData) {
  if (!hasAppEnv()) redirect("/setup")

  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")
  const userId = await authenticateUser(email, password)

  if (!userId) redirect("/login?error=Invalid%20email%20or%20password")

  await createSession(userId)
  redirect("/dashboard")
}

export async function signOutAction() {
  await destroyCurrentSession()
  redirect("/login")
}

export async function createRiskAction(formData: FormData) {
  const { profile } = await requireProfile()
  const sql = getSql()
  const parsed = riskSchema.safeParse(formToObject(formData))

  if (!parsed.success) {
    redirect(`/risks/new?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid risk")}`)
  }

  if (!canSeeAllDepartments(profile.role) && parsed.data.department_id !== profile.department_id) {
    throw new Error("You can only create risks for your assigned department.")
  }

  const inherent = calculateRisk(parsed.data.likelihood_score, parsed.data.impact_score)
  const residual = calculateRisk(
    parsed.data.residual_likelihood_score,
    parsed.data.residual_impact_score
  )
  const submit = formData.get("intent") === "submit"
  const status = submit ? "submitted_to_manager" : "draft"
  const approvalStatus = submit ? "Pending Department Manager Review" : "Draft"
  const attachments = JSON.stringify(parseAttachments(parsed.data.attachments))

  const rows = await sql`
    insert into risks (
      department_id,
      category_id,
      owner_id,
      title,
      description,
      causes,
      consequences,
      existing_controls,
      current_controls,
      likelihood_score,
      impact_score,
      inherent_score,
      inherent_level,
      residual_likelihood_score,
      residual_impact_score,
      residual_score,
      residual_level,
      mitigation_actions,
      action_owner,
      target_completion_date,
      status,
      review_comments,
      approval_status,
      attachments,
      created_by,
      updated_by
    )
    values (
      ${parsed.data.department_id},
      ${parsed.data.category_id},
      ${parsed.data.owner_id || null},
      ${parsed.data.title},
      ${parsed.data.description},
      ${parsed.data.causes},
      ${parsed.data.consequences},
      ${parsed.data.existing_controls},
      ${parsed.data.current_controls},
      ${parsed.data.likelihood_score},
      ${parsed.data.impact_score},
      ${inherent.score},
      ${inherent.level},
      ${parsed.data.residual_likelihood_score},
      ${parsed.data.residual_impact_score},
      ${residual.score},
      ${residual.level},
      ${parsed.data.mitigation_actions},
      ${parsed.data.action_owner},
      ${parsed.data.target_completion_date || null},
      ${status},
      ${parsed.data.review_comments || null},
      ${approvalStatus},
      ${attachments}::jsonb,
      ${profile.id},
      ${profile.id}
    )
    returning id, status
  `

  const row = (rows as { id: string; status: WorkflowStatus }[])[0]
  await logEvent(row.id, null, row.status, submit ? "Submitted from creation." : "Saved as draft.")
  revalidatePath("/dashboard")
  revalidatePath("/risks")
  redirect(`/risks/${row.id}/edit`)
}

export async function updateRiskAction(riskId: string, formData: FormData) {
  const { profile } = await requireProfile()
  const sql = getSql()
  const existingRows = await sql`
    select status, department_id
    from risks
    where id = ${riskId}
    limit 1
  `
  const existing = (existingRows as { status: WorkflowStatus; department_id: string }[])[0]

  if (!existing) throw new Error("Risk not found.")
  if (!canSeeAllDepartments(profile.role) && existing.department_id !== profile.department_id) {
    throw new Error("You cannot edit another department's risk.")
  }
  if (!canEditRisk(profile.role, existing.status)) {
    throw new Error("This risk cannot be edited in its current workflow status.")
  }

  const parsed = riskSchema.safeParse(formToObject(formData))
  if (!parsed.success) {
    redirect(`/risks/${riskId}/edit?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid risk")}`)
  }

  const inherent = calculateRisk(parsed.data.likelihood_score, parsed.data.impact_score)
  const residual = calculateRisk(
    parsed.data.residual_likelihood_score,
    parsed.data.residual_impact_score
  )
  const attachments = JSON.stringify(parseAttachments(parsed.data.attachments))

  await sql`
    update risks
    set
      department_id = ${parsed.data.department_id},
      category_id = ${parsed.data.category_id},
      owner_id = ${parsed.data.owner_id || null},
      title = ${parsed.data.title},
      description = ${parsed.data.description},
      causes = ${parsed.data.causes},
      consequences = ${parsed.data.consequences},
      existing_controls = ${parsed.data.existing_controls},
      current_controls = ${parsed.data.current_controls},
      likelihood_score = ${parsed.data.likelihood_score},
      impact_score = ${parsed.data.impact_score},
      inherent_score = ${inherent.score},
      inherent_level = ${inherent.level},
      residual_likelihood_score = ${parsed.data.residual_likelihood_score},
      residual_impact_score = ${parsed.data.residual_impact_score},
      residual_score = ${residual.score},
      residual_level = ${residual.level},
      mitigation_actions = ${parsed.data.mitigation_actions},
      action_owner = ${parsed.data.action_owner},
      target_completion_date = ${parsed.data.target_completion_date || null},
      review_comments = ${parsed.data.review_comments || null},
      approval_status = ${parsed.data.approval_status},
      attachments = ${attachments}::jsonb,
      updated_by = ${profile.id}
    where id = ${riskId}
  `

  revalidatePath("/dashboard")
  revalidatePath("/risks")
  revalidatePath(`/risks/${riskId}/edit`)
}

export async function workflowAction(riskId: string, formData: FormData) {
  const { profile } = await requireProfile()
  const sql = getSql()
  const action = String(formData.get("action") ?? "")
  const comments = String(formData.get("comments") ?? "")
  const rows = await sql`
    select status, department_id
    from risks
    where id = ${riskId}
    limit 1
  `
  const risk = (rows as { status: WorkflowStatus; department_id: string }[])[0]

  if (!risk) throw new Error("Risk not found.")
  if (!canSeeAllDepartments(profile.role) && risk.department_id !== profile.department_id) {
    throw new Error("You cannot review another department's risk.")
  }

  const nextStatus = transitionForAction(action, profile.role, risk.status)
  if (!nextStatus) throw new Error("This workflow action is not allowed.")

  const approvalStatus =
    nextStatus === "submitted_to_manager"
      ? "Pending Department Manager Review"
      : nextStatus === "under_strategy_review"
        ? "Pending Strategy Team Review"
        : nextStatus === "returned_to_user" || nextStatus === "returned_to_department"
          ? "Returned for Correction"
          : nextStatus === "official_risk"
            ? "Confirmed Official"
            : "Final Approved"

  await sql`
    update risks
    set
      status = ${nextStatus},
      approval_status = ${approvalStatus},
      review_comments = ${comments || null},
      updated_by = ${profile.id}
    where id = ${riskId}
  `

  await logEvent(riskId, risk.status, nextStatus, comments)
  revalidatePath("/dashboard")
  revalidatePath("/risks")
  redirect(`/risks/${riskId}/review`)
}
