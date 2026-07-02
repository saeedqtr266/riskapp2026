import type { RiskLevel, UserRole, WorkflowStatus } from "./types"

export function calculateRiskScore(likelihood: number, impact: number) {
  return Number(likelihood || 0) * Number(impact || 0)
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 16) return "Critical"
  if (score >= 10) return "High"
  if (score >= 5) return "Medium"
  return "Low"
}

export function calculateRisk(likelihood: number, impact: number) {
  const score = calculateRiskScore(likelihood, impact)
  return { score, level: getRiskLevel(score) }
}

export const statusLabels: Record<WorkflowStatus, string> = {
  draft: "Draft",
  submitted_to_manager: "Submitted to Department Manager",
  returned_to_user: "Returned to Department User",
  under_strategy_review: "Under Strategy Review",
  returned_to_department: "Returned to Department",
  official_risk: "Confirmed as Official Risk",
  final_approved: "Final Approved Risk",
}

export const roleLabels: Record<UserRole, string> = {
  department_user: "Department User",
  department_manager: "Department Manager",
  strategy_team: "Strategy Team",
  system_admin: "System Admin",
}

export function canSeeAllDepartments(role: UserRole) {
  return role === "strategy_team" || role === "system_admin"
}

export function canManageAdmin(role: UserRole) {
  return role === "system_admin"
}

export function canEditRisk(role: UserRole, status: WorkflowStatus) {
  if (role === "system_admin" || role === "strategy_team") return true
  if (role === "department_user") {
    return status === "draft" || status === "returned_to_user"
  }
  if (role === "department_manager") {
    return status === "submitted_to_manager" || status === "returned_to_department"
  }
  return false
}

export function nextAllowedActions(role: UserRole, status: WorkflowStatus) {
  if (role === "department_user" && (status === "draft" || status === "returned_to_user")) {
    return ["submit_to_manager"] as const
  }
  if (role === "department_manager" && status === "submitted_to_manager") {
    return ["submit_to_strategy", "return_to_user"] as const
  }
  if (role === "department_manager" && status === "returned_to_department") {
    return ["submit_to_strategy"] as const
  }
  if (role === "strategy_team" || role === "system_admin") {
    if (status === "under_strategy_review") {
      return ["confirm_official", "return_to_department"] as const
    }
    if (status === "official_risk") {
      return ["final_approve", "return_to_department"] as const
    }
  }
  return [] as const
}

export function transitionForAction(
  action: string,
  role: UserRole,
  status: WorkflowStatus
): WorkflowStatus | null {
  const allowed = nextAllowedActions(role, status) as readonly string[]
  if (!allowed.includes(action)) return null
  if (action === "submit_to_manager") return "submitted_to_manager"
  if (action === "return_to_user") return "returned_to_user"
  if (action === "submit_to_strategy") return "under_strategy_review"
  if (action === "confirm_official") return "official_risk"
  if (action === "return_to_department") return "returned_to_department"
  if (action === "final_approve") return "final_approved"
  return null
}

export function levelClass(level: RiskLevel) {
  if (level === "Critical") return "border-red-200 bg-red-50 text-red-700"
  if (level === "High") return "border-orange-200 bg-orange-50 text-orange-700"
  if (level === "Medium") return "border-amber-200 bg-amber-50 text-amber-700"
  return "border-emerald-200 bg-emerald-50 text-emerald-700"
}
