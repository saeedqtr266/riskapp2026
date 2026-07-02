import ExcelJS from "exceljs"
import { NextResponse, type NextRequest } from "next/server"
import { requireProfile } from "@/lib/data"
import { getSql } from "@/lib/db"
import { canSeeAllDepartments, statusLabels } from "@/lib/risk/calculations"

export const dynamic = "force-dynamic"

type ExportRiskRow = {
  [key: string]: unknown
  status: keyof typeof statusLabels
  attachments: unknown
}

export async function GET(request: NextRequest) {
  const { profile } = await requireProfile()
  const sql = getSql()
  const department = request.nextUrl.searchParams.get("department")
  const scopedDepartment = canSeeAllDepartments(profile.role) ? department : profile.department_id

  const data = scopedDepartment
    ? await sql`
        select
          r.*,
          d.name as department,
          c.name as category,
          o.full_name as owner
        from risks r
        join departments d on d.id = r.department_id
        join risk_categories c on c.id = r.category_id
        left join profiles o on o.id = r.owner_id
        where r.department_id = ${scopedDepartment}
        order by r.risk_code
      `
    : await sql`
        select
          r.*,
          d.name as department,
          c.name as category,
          o.full_name as owner
        from risks r
        join departments d on d.id = r.department_id
        join risk_categories c on c.id = r.category_id
        left join profiles o on o.id = r.owner_id
        order by r.risk_code
      `

  const workbook = new ExcelJS.Workbook()
  workbook.creator = "Enterprise Risk Register"
  workbook.created = new Date()
  const sheet = workbook.addWorksheet("Risk Register", {
    views: [{ state: "frozen", ySplit: 1 }],
  })

  sheet.columns = [
    { header: "Risk ID", key: "risk_code", width: 16 },
    { header: "Department", key: "department", width: 24 },
    { header: "Title", key: "title", width: 34 },
    { header: "Description", key: "description", width: 44 },
    { header: "Category", key: "category", width: 22 },
    { header: "Owner", key: "owner", width: 22 },
    { header: "Causes", key: "causes", width: 34 },
    { header: "Consequences", key: "consequences", width: 34 },
    { header: "Existing Controls", key: "existing_controls", width: 34 },
    { header: "Likelihood", key: "likelihood_score", width: 12 },
    { header: "Impact", key: "impact_score", width: 12 },
    { header: "Inherent Score", key: "inherent_score", width: 15 },
    { header: "Inherent Level", key: "inherent_level", width: 15 },
    { header: "Residual Likelihood", key: "residual_likelihood_score", width: 18 },
    { header: "Residual Impact", key: "residual_impact_score", width: 16 },
    { header: "Residual Score", key: "residual_score", width: 15 },
    { header: "Residual Level", key: "residual_level", width: 15 },
    { header: "Mitigation Actions", key: "mitigation_actions", width: 38 },
    { header: "Action Owner", key: "action_owner", width: 20 },
    { header: "Target Date", key: "target_completion_date", width: 16 },
    { header: "Workflow Status", key: "status", width: 28 },
    { header: "Approval Status", key: "approval_status", width: 26 },
    { header: "Review Comments", key: "review_comments", width: 34 },
    { header: "Attachments", key: "attachments", width: 34 },
  ]

  for (const risk of data as ExportRiskRow[]) {
    sheet.addRow({
      ...risk,
      status: statusLabels[risk.status as keyof typeof statusLabels],
      attachments: Array.isArray(risk.attachments) ? risk.attachments.join("\n") : "",
    })
  }

  sheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F3A4A" } }
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true }
    cell.border = { bottom: { style: "thin", color: { argb: "FFCBD5E1" } } }
  })
  sheet.autoFilter = { from: "A1", to: "X1" }
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) row.alignment = { vertical: "top", wrapText: true }
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return new NextResponse(buffer as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="risk-register-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  })
}
