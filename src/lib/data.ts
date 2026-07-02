import { redirect } from "next/navigation"
import { getSessionProfile } from "@/lib/auth"
import { getSql, hasDatabaseEnv } from "@/lib/db"
import { canSeeAllDepartments } from "@/lib/risk/calculations"
import type { Category, Department, Profile, Risk, WorkflowEvent } from "@/lib/risk/types"

type RiskRow = Risk & {
  department_name: string
  department_code: string
  category_name: string
  owner_name: string | null
  owner_email: string | null
}

type AdminDepartmentRow = Department
type AdminCategoryRow = Category
type AdminUserRow = Pick<Profile, "id" | "email" | "full_name" | "role" | "department_id"> & {
  department_name: string | null
}
type AdminAuditRow = {
  id: string
  from_status: string | null
  to_status: string
  actor_name: string | null
  created_at: string
}

type WorkflowEventRow = WorkflowEvent & {
  actor_name: string | null
  actor_email: string | null
}

function mapRisk(row: RiskRow): Risk {
  return {
    ...row,
    departments: {
      id: row.department_id,
      name: row.department_name,
      code: row.department_code,
    },
    risk_categories: {
      id: row.category_id,
      name: row.category_name,
    },
    owner: row.owner_id
      ? {
          id: row.owner_id,
          full_name: row.owner_name ?? "Unassigned",
          email: row.owner_email ?? "",
        }
      : null,
  }
}

export async function getCurrentProfile() {
  if (!hasDatabaseEnv()) {
    return { profile: null }
  }

  const profile = await getSessionProfile()
  return { profile }
}

export async function requireProfile() {
  if (!hasDatabaseEnv()) redirect("/setup")

  const profile = await getSessionProfile()
  if (!profile) redirect("/login")
  return { profile }
}

export async function getLookups() {
  const { profile } = await requireProfile()
  const sql = getSql()
  const [departments, categories, users] = await Promise.all([
    sql`select id, name, code from departments order by name`,
    sql`select id, name from risk_categories order by name`,
    canSeeAllDepartments(profile.role)
      ? sql`select id, full_name, email, role, department_id from profiles where active = true order by full_name`
      : sql`select id, full_name, email, role, department_id from profiles where active = true and department_id = ${profile.department_id} order by full_name`,
  ])

  return {
    departments: departments as Department[],
    categories: categories as Category[],
    users: users as Pick<Profile, "id" | "full_name" | "email" | "role" | "department_id">[],
  }
}

export async function getRisks() {
  const { profile } = await requireProfile()
  const sql = getSql()
  const rows = canSeeAllDepartments(profile.role)
    ? await sql`
        select
          r.*,
          d.name as department_name,
          d.code as department_code,
          c.name as category_name,
          o.full_name as owner_name,
          o.email as owner_email
        from risks r
        join departments d on d.id = r.department_id
        join risk_categories c on c.id = r.category_id
        left join profiles o on o.id = r.owner_id
        order by r.updated_at desc
      `
    : await sql`
        select
          r.*,
          d.name as department_name,
          d.code as department_code,
          c.name as category_name,
          o.full_name as owner_name,
          o.email as owner_email
        from risks r
        join departments d on d.id = r.department_id
        join risk_categories c on c.id = r.category_id
        left join profiles o on o.id = r.owner_id
        where r.department_id = ${profile.department_id}
        order by r.updated_at desc
      `

  return (rows as RiskRow[]).map(mapRisk)
}

export async function getRisk(id: string) {
  const { profile } = await requireProfile()
  const sql = getSql()
  const rows = canSeeAllDepartments(profile.role)
    ? await sql`
        select
          r.*,
          d.name as department_name,
          d.code as department_code,
          c.name as category_name,
          o.full_name as owner_name,
          o.email as owner_email
        from risks r
        join departments d on d.id = r.department_id
        join risk_categories c on c.id = r.category_id
        left join profiles o on o.id = r.owner_id
        where r.id = ${id}
        limit 1
      `
    : await sql`
        select
          r.*,
          d.name as department_name,
          d.code as department_code,
          c.name as category_name,
          o.full_name as owner_name,
          o.email as owner_email
        from risks r
        join departments d on d.id = r.department_id
        join risk_categories c on c.id = r.category_id
        left join profiles o on o.id = r.owner_id
        where r.id = ${id} and r.department_id = ${profile.department_id}
        limit 1
      `

  const row = (rows as RiskRow[])[0]
  if (!row) throw new Error("Risk not found or not accessible.")
  return mapRisk(row)
}

export async function getWorkflowEvents(riskId: string): Promise<WorkflowEvent[]> {
  await getRisk(riskId)
  const sql = getSql()
  const rows = await sql`
    select
      e.*,
      p.full_name as actor_name,
      p.email as actor_email
    from risk_workflow_events e
    left join profiles p on p.id = e.actor_id
    where e.risk_id = ${riskId}
    order by e.created_at desc
  `

  return (rows as WorkflowEventRow[]).map((row) => ({
    ...row,
    actor: row.actor_name
      ? {
          full_name: row.actor_name,
          email: row.actor_email ?? "",
        }
      : null,
  }))
}

export async function getAdminData() {
  const { profile } = await requireProfile()
  if (profile.role !== "system_admin") redirect("/dashboard")

  const sql = getSql()
  const [departments, categories, users, audit] = await Promise.all([
    sql`select id, name, code from departments order by name`,
    sql`select id, name from risk_categories order by name`,
    sql`
      select p.id, p.email, p.full_name, p.role, p.department_id, d.name as department_name
      from profiles p
      left join departments d on d.id = p.department_id
      order by p.full_name
    `,
    sql`
      select e.*, p.full_name as actor_name
      from risk_workflow_events e
      left join profiles p on p.id = e.actor_id
      order by e.created_at desc
      limit 25
    `,
  ])

  return {
    departments: departments as AdminDepartmentRow[],
    categories: categories as AdminCategoryRow[],
    users: users as AdminUserRow[],
    audit: audit as AdminAuditRow[],
  }
}
