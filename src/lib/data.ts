import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { hasSupabaseEnv } from "@/lib/env"
import { canSeeAllDepartments } from "@/lib/risk/calculations"
import type { Profile, Risk } from "@/lib/risk/types"

export async function getCurrentProfile() {
  if (!hasSupabaseEnv()) {
    return { supabase: null, user: null, profile: null }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { supabase, user: null, profile: null }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*, department:departments(*)")
    .eq("id", user.id)
    .single()

  if (error || !profile) return { supabase, user, profile: null }
  return { supabase, user, profile: profile as Profile }
}

export async function requireProfile() {
  const auth = await getCurrentProfile()
  if (!hasSupabaseEnv()) redirect("/setup")
  if (!auth.user) redirect("/login")
  if (!auth.profile) redirect("/login?error=profile")
  return auth as typeof auth & { profile: Profile; supabase: NonNullable<typeof auth.supabase> }
}

export async function getLookups() {
  const { supabase } = await requireProfile()
  const [departments, categories, users] = await Promise.all([
    supabase.from("departments").select("*").order("name"),
    supabase.from("risk_categories").select("*").order("name"),
    supabase.from("profiles").select("id, full_name, email, role, department_id").order("full_name"),
  ])

  return {
    departments: departments.data ?? [],
    categories: categories.data ?? [],
    users: users.data ?? [],
  }
}

export async function getRisks() {
  const { supabase, profile } = await requireProfile()
  let query = supabase
    .from("risks")
    .select("*, departments(*), risk_categories(*), owner:profiles!risks_owner_id_fkey(id, full_name, email)")
    .order("updated_at", { ascending: false })

  if (!canSeeAllDepartments(profile.role) && profile.department_id) {
    query = query.eq("department_id", profile.department_id)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as Risk[]
}

export async function getRisk(id: string) {
  const { supabase } = await requireProfile()
  const { data, error } = await supabase
    .from("risks")
    .select("*, departments(*), risk_categories(*), owner:profiles!risks_owner_id_fkey(id, full_name, email)")
    .eq("id", id)
    .single()

  if (error) throw new Error(error.message)
  return data as Risk
}

export async function getWorkflowEvents(riskId: string) {
  const { supabase } = await requireProfile()
  const { data } = await supabase
    .from("risk_workflow_events")
    .select("*, actor:profiles(full_name, email)")
    .eq("risk_id", riskId)
    .order("created_at", { ascending: false })

  return data ?? []
}
