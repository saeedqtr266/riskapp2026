"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import { levelClass, statusLabels } from "@/lib/risk/calculations"
import type { Risk } from "@/lib/risk/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function RiskTable({ risks, showDepartment = true }: { risks: Risk[]; showDepartment?: boolean }) {
  const [query, setQuery] = useState("")
  const [level, setLevel] = useState("all")
  const [status, setStatus] = useState("all")

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return risks.filter((risk) => {
      const matchesQuery =
        risk.title.toLowerCase().includes(q) ||
        risk.risk_code.toLowerCase().includes(q) ||
        risk.description.toLowerCase().includes(q)
      return (
        matchesQuery &&
        (level === "all" || risk.residual_level === level) &&
        (status === "all" || risk.status === status)
      )
    })
  }, [risks, query, level, status])

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Search risk ID, title, or description"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <select
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm"
          value={level}
          onChange={(event) => setLevel(event.target.value)}
          aria-label="Filter by risk level"
        >
          <option value="all">All levels</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Critical">Critical</option>
        </select>
        <select
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Risk ID</TableHead>
            <TableHead>Risk</TableHead>
            {showDepartment ? <TableHead>Department</TableHead> : null}
            <TableHead>Category</TableHead>
            <TableHead>Residual</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Target</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((risk) => (
            <TableRow key={risk.id}>
              <TableCell className="font-mono text-xs">{risk.risk_code}</TableCell>
              <TableCell>
                <p className="font-medium">{risk.title}</p>
                <p className="line-clamp-1 text-xs text-slate-500">{risk.description}</p>
              </TableCell>
              {showDepartment ? <TableCell>{risk.departments?.name}</TableCell> : null}
              <TableCell>{risk.risk_categories?.name}</TableCell>
              <TableCell>
                <Badge variant="outline" className={levelClass(risk.residual_level)}>
                  {risk.residual_score} {risk.residual_level}
                </Badge>
              </TableCell>
              <TableCell>{statusLabels[risk.status]}</TableCell>
              <TableCell>{risk.target_completion_date ?? "Not set"}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Link href={`/risks/${risk.id}/edit`}>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </Link>
                  <Link href={`/risks/${risk.id}/review`}>
                    <Button size="sm">Review</Button>
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {filtered.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-500">No risks match the selected filters.</div>
      ) : null}
    </div>
  )
}
