import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL

if (!databaseUrl) {
  console.error("Missing DATABASE_URL or POSTGRES_URL")
  process.exit(1)
}

const sql = neon(databaseUrl)
const password = "RiskMVP!2026"
const users = [
  { email: "department.user@example.gov", full_name: "Department User", role: "department_user", department: "Information Technology" },
  { email: "department.manager@example.gov", full_name: "Department Manager", role: "department_manager", department: "Information Technology" },
  { email: "strategy@example.gov", full_name: "Strategy Team User", role: "strategy_team", department: "Strategy" },
  { email: "admin@example.gov", full_name: "System Admin", role: "system_admin", department: "Strategy" },
]

function riskLevel(score) {
  if (score >= 16) return "Critical"
  if (score >= 10) return "High"
  if (score >= 5) return "Medium"
  return "Low"
}

async function main() {
  const departments = await sql`select id, name from departments`
  const categories = await sql`select id, name from risk_categories`
  const departmentByName = new Map(departments.map((department) => [department.name, department]))
  const categoryByName = new Map(categories.map((category) => [category.name, category]))
  const passwordHash = await bcrypt.hash(password, 12)
  const createdUsers = []

  for (const user of users) {
    const department = departmentByName.get(user.department)
    const rows = await sql`
      insert into profiles (email, password_hash, full_name, role, department_id, active)
      values (${user.email}, ${passwordHash}, ${user.full_name}, ${user.role}, ${department?.id ?? null}, true)
      on conflict (email) do update set
        password_hash = excluded.password_hash,
        full_name = excluded.full_name,
        role = excluded.role,
        department_id = excluded.department_id,
        active = true
      returning id, department_id
    `
    createdUsers.push({ ...user, id: rows[0].id, department_id: rows[0].department_id })
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
    const existing = await sql`select id from risks where title = ${risk.title} limit 1`
    const rows = existing.length
      ? await sql`
          update risks set
            department_id = ${risk.department_id},
            category_id = ${risk.category_id},
            owner_id = ${risk.owner_id},
            description = ${risk.description},
            causes = ${risk.causes},
            consequences = ${risk.consequences},
            existing_controls = ${risk.existing_controls},
            current_controls = ${risk.current_controls},
            likelihood_score = ${risk.likelihood_score},
            impact_score = ${risk.impact_score},
            inherent_score = ${risk.inherent_score},
            inherent_level = ${risk.inherent_level},
            residual_likelihood_score = ${risk.residual_likelihood_score},
            residual_impact_score = ${risk.residual_impact_score},
            residual_score = ${risk.residual_score},
            residual_level = ${risk.residual_level},
            mitigation_actions = ${risk.mitigation_actions},
            action_owner = ${risk.action_owner},
            target_completion_date = ${risk.target_completion_date},
            status = ${risk.status},
            approval_status = ${risk.approval_status},
            updated_by = ${risk.updated_by}
          where id = ${existing[0].id}
          returning id, status
        `
      : await sql`
          insert into risks (
            department_id, category_id, owner_id, title, description, causes, consequences,
            existing_controls, current_controls, likelihood_score, impact_score, inherent_score,
            inherent_level, residual_likelihood_score, residual_impact_score, residual_score,
            residual_level, mitigation_actions, action_owner, target_completion_date, status,
            approval_status, created_by, updated_by
          )
          values (
            ${risk.department_id}, ${risk.category_id}, ${risk.owner_id}, ${risk.title},
            ${risk.description}, ${risk.causes}, ${risk.consequences}, ${risk.existing_controls},
            ${risk.current_controls}, ${risk.likelihood_score}, ${risk.impact_score},
            ${risk.inherent_score}, ${risk.inherent_level}, ${risk.residual_likelihood_score},
            ${risk.residual_impact_score}, ${risk.residual_score}, ${risk.residual_level},
            ${risk.mitigation_actions}, ${risk.action_owner}, ${risk.target_completion_date},
            ${risk.status}, ${risk.approval_status}, ${risk.created_by}, ${risk.updated_by}
          )
          returning id, status
        `

    await sql`
      insert into risk_workflow_events (risk_id, actor_id, to_status, comments)
      values (${rows[0].id}, ${risk.created_by}, ${rows[0].status}, 'Seed data.')
    `
  }

  console.log("Seed complete.")
  console.table(users.map((user) => ({ email: user.email, password, role: user.role })))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
