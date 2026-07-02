"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { requireProfile } from "@/lib/data"
import { hasSupabaseEnv } from "@/lib/env"
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
  const { supabase, profile } = await requireProfile()
  await supabase.from("risk_workflow_events").insert({
    risk_id: riskId,
    actor_id: profile.id,
    from_status: fromStatus,
    to_status: toStatus,
    comments: comments || null,
  })
}

export async function signInAction(formData: FormData) {
  if (!hasSupabaseEnv()) redirect("/setup")

  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`)
  redirect("/dashboard")
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

export async function createRiskAction(formData: FormData) {
  const { supabase, profile } = await requireProfile()
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
  const { data, error } = await supabase
    .from("risks")
    .insert({
      ...parsed.data,
      attachments: parseAttachments(parsed.data.attachments),
      owner_id: parsed.data.owner_id || null,
      target_completion_date: parsed.data.target_completion_date || null,
      inherent_score: inherent.score,
      inherent_level: inherent.level,
      residual_score: residual.score,
      residual_level: residual.level,
      status: submit ? "submitted_to_manager" : "draft",
      approval_status: submit ? "Pending Department Manager Review" : "Draft",
      created_by: profile.id,
      updated_by: profile.id,
    })
    .select("id, status")
    .single()

  if (error) throw new Error(error.message)
  await logEvent(data.id, null, data.status as WorkflowStatus, submit ? "Submitted from creation." : "Saved as draft.")
  revalidatePath("/risks")
  redirect(`/risks/${data.id}/edit`)
}

export async function updateRiskAction(riskId: string, formData: FormData) {
  const { supabase, profile } = await requireProfile()
  const { data: existing, error: readError } = await supabase
    .from("risks")
    .select("status, department_id")
    .eq("id", riskId)
    .single()

  if (readError) throw new Error(readError.message)
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
  const { error } = await supabase
    .from("risks")
    .update({
      ...parsed.data,
      attachments: parseAttachments(parsed.data.attachments),
      owner_id: parsed.data.owner_id || null,
      target_completion_date: parsed.data.target_completion_date || null,
      inherent_score: inherent.score,
      inherent_level: inherent.level,
      residual_score: residual.score,
      residual_level: residual.level,
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", riskId)

  if (error) throw new Error(error.message)
  revalidatePath("/risks")
  revalidatePath(`/risks/${riskId}/edit`)
}

export async function workflowAction(riskId: string, formData: FormData) {
  const { supabase, profile } = await requireProfile()
  const action = String(formData.get("action") ?? "")
  const comments = String(formData.get("comments") ?? "")
  const { data: risk, error: readError } = await supabase
    .from("risks")
    .select("status, department_id")
    .eq("id", riskId)
    .single()

  if (readError) throw new Error(readError.message)
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

  const { error } = await supabase
    .from("risks")
    .update({
      status: nextStatus,
      approval_status: approvalStatus,
      review_comments: comments || null,
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", riskId)

  if (error) throw new Error(error.message)
  await logEvent(riskId, risk.status, nextStatus, comments)
  revalidatePath("/dashboard")
  revalidatePath("/risks")
  redirect(`/risks/${riskId}/review`)
}
