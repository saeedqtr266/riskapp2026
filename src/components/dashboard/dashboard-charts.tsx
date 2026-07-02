"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const colors = ["#0f766e", "#1d4ed8", "#d97706", "#dc2626", "#64748b", "#7c3aed"]

export function DashboardCharts({
  byDepartment,
  byStatus,
  byLevel,
}: {
  byDepartment: { name: string; total: number }[]
  byStatus: { name: string; total: number }[]
  byLevel: { name: string; total: number }[]
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold">Risks by department</h2>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={byDepartment}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="total" fill="#0f766e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold">Workflow status</h2>
        <div className="h-64">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={byStatus} dataKey="total" nameKey="name" outerRadius={88} label>
                {byStatus.map((_, index) => (
                  <Cell key={index} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold">Residual level</h2>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={byLevel} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} />
              <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="total" fill="#1d4ed8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
