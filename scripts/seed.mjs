import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const password = "RiskMVP!2026"
const users = [
  { email: "department.user@example.gov", full_name: "Department User", role: "department_user", department: "Information Technology" },
  { email: "department.manager@example.gov", full_name: "Department Manager", role: "department_manager", department: "Information Technology" },
  { email: "strategy@example.gov", full_name: "Strategy Team User", role: "strategy_team", department: "Strategy" },
  { email: "admin@example.gov", full_name: "System Admin", role: "system_admin", department: "Strategy" },
]

async function upsertAuthUser(user) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: user.full_name, role: user.role },
  })
  if (!error) return data.user

  const { data: list, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) throw listError
  const existing = list.users.find((item) => item.email === user.email)
  if (!existing) throw error
  return existing
}

function riskLevel(score) {
  if (score >= 16) return "Critical"
  if (score >= 10) return "High"
  if (score >= 5) return "Medium"
  return "Low"
}

async function main() {
  const { data: departments, error: deptError } = await supabase.from("departments").select("*")
  if (deptError) throw deptError
  const { data: categories, error: catError } = await supabase.from("risk_categories").select("*")
  if (catError) throw catError

  const departmentByName = new Map(departments.map((department) => [department.name, department]))
  const categoryByName = new Map(categories.map((category) => [category.name, category]))
  const createdUsers = []

  for (const user of users) {
    const authUser = await upsertAuthUser(user)
    const department = departmentByName.get(user.department)
    const { error } = await supabase.from("profiles").upsert({
      id: authUser.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      department_id: department?.id ?? null,
      active: true,
    })
    if (error) throw error
    createdUsers.push({ ...user, id: authUser.id, department_id: department?.id })
  }

  const itDept = departmentByName.get("Information Technology")
  const financeDept = departmentByName.get("Finance")
  const cyber = categoryByName.get("Cybersecurity")
  const financial = categoryByName.get("Financial")
  const operational = categoryByName.get("Operational")
  const creator = createdUsers.find((user) => user.role === "department_user")
  const manager = createdUsers.find((user) => user.role === "department_manager")

  const samples = [
    {
      department_id: itDept.id,
      category_id: cyber.id,
      owner_id: creator.id,
      title: "Privileged account compromise",
      description: "Administrative credentials could be compromised through phishing or weak MFA adoption.",
      causes: "Targeted phishing, dormant accounts, inconsistent access reviews.",
      consequences: "Unauthorized access to sensitive systems and disruption of critical services.",
      existing_controls: "MFA, quarterly access review, SIEM alerts.",
      current_controls: "Conditional access and privileged identity management.",
      likelihood_score: 4,
      impact_score: 5,
      residual_likelihood_score: 3,
      residual_impact_score: 4,
      mitigation_actions: "Complete privileged access review and enforce phishing-resistant MFA.",
      action_owner: "IT Security Lead",
      target_completion_date: "2026-08-31",
      status: "submitted_to_manager",
      approval_status: "Pending Department Manager Review",
      created_by: creator.id,
      updated_by: creator.id,
    },
    {
      department_id: financeDept.id,
      category_id: financial.id,
      owner_id: null,
      title: "Budget forecast variance",
      description: "Late cost updates from business units may cause material forecast variance.",
      causes: "Manual spreadsheet consolidation and delayed submissions.",
      consequences: "Leadership decisions may be based on stale financial assumptions.",
      existing_controls: "Monthly reconciliation and finance review.",
      current_controls: "Department sign-off before submission.",
      likelihood_score: 3,
      impact_score: 4,
      residual_likelihood_score: 2,
      residual_impact_score: 3,
      mitigation_actions: "Automate submission tracking and enforce cutoff reminders.",
      action_owner: "Finance Planning Manager",
      target_completion_date: "2026-09-15",
      status: "under_strategy_review",
      approval_status: "Pending Strategy Team Review",
      created_by: manager.id,
      updated_by: manager.id,
    },
    {
      department_id: itDept.id,
      category_id: operational.id,
      owner_id: creator.id,
      title: "Core service recovery delay",
      description: "Disaster recovery tests show recovery time could exceed the agreed objective.",
      causes: "Incomplete dependency inventory and manual recovery procedures.",
      consequences: "Extended downtime for internal digital services.",
      existing_controls: "Annual DR exercise and offsite backups.",
      current_controls: "Runbook-based recovery process.",
      likelihood_score: 3,
      impact_score: 5,
      residual_likelihood_score: 2,
      residual_impact_score: 4,
      mitigation_actions: "Refresh dependency map and automate recovery validation.",
      action_owner: "Infrastructure Manager",
      target_completion_date: "2026-07-20",
      status: "draft",
      approval_status: "Draft",
      created_by: creator.id,
      updated_by: creator.id,
    },
  ].map((risk) => {
    const inherent_score = risk.likelihood_score * risk.impact_score
    const residual_score = risk.residual_likelihood_score * risk.residual_impact_score
    return {
      ...risk,
      inherent_score,
      inherent_level: riskLevel(inherent_score),
      residual_score,
      residual_level: riskLevel(residual_score),
    }
  })

  for (const risk of samples) {
    const { data: existing } = await supabase.from("risks").select("id").eq("title", risk.title).maybeSingle()
    const query = existing
      ? supabase.from("risks").update(risk).eq("id", existing.id).select("id, status").single()
      : supabase.from("risks").insert(risk).select("id, status").single()
    const { data, error } = await query
    if (error) throw error
    await supabase.from("risk_workflow_events").insert({
      risk_id: data.id,
      actor_id: risk.created_by,
      to_status: data.status,
      comments: "Seed data.",
    })
  }

  console.log("Seed complete.")
  console.table(users.map((user) => ({ email: user.email, password, role: user.role })))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
