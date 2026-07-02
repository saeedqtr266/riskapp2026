export type UserRole =
  | "department_user"
  | "department_manager"
  | "strategy_team"
  | "system_admin"

export type WorkflowStatus =
  | "draft"
  | "submitted_to_manager"
  | "returned_to_user"
  | "under_strategy_review"
  | "returned_to_department"
  | "official_risk"
  | "final_approved"

export type RiskLevel = "Low" | "Medium" | "High" | "Critical"

export type Profile = {
  id: string
  email: string
  full_name: string
  role: UserRole
  department_id: string | null
  department?: Department | null
}

export type Department = {
  id: string
  name: string
  code: string
}

export type Category = {
  id: string
  name: string
}

export type Risk = {
  id: string
  risk_code: string
  department_id: string
  category_id: string
  owner_id: string | null
  title: string
  description: string
  causes: string
  consequences: string
  existing_controls: string
  current_controls: string
  likelihood_score: number
  impact_score: number
  inherent_score: number
  inherent_level: RiskLevel
  residual_likelihood_score: number
  residual_impact_score: number
  residual_score: number
  residual_level: RiskLevel
  mitigation_actions: string
  action_owner: string
  target_completion_date: string | null
  status: WorkflowStatus
  review_comments: string | null
  approval_status: string
  attachments: string[]
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  departments?: Department
  risk_categories?: Category
  owner?: Pick<Profile, "id" | "full_name" | "email"> | null
}

export type WorkflowEvent = {
  id: string
  risk_id: string
  actor_id: string | null
  from_status: WorkflowStatus | null
  to_status: WorkflowStatus
  comments: string | null
  created_at: string
  actor?: Pick<Profile, "full_name" | "email"> | null
}
