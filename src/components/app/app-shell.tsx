import Link from "next/link"
import { redirect } from "next/navigation"
import {
  BarChart3,
  Building2,
  ClipboardList,
  FileSpreadsheet,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react"
import { signOutAction } from "@/lib/actions"
import { requireProfile } from "@/lib/data"
import { canManageAdmin, canSeeAllDepartments, roleLabels } from "@/lib/risk/calculations"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const navBase = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/risks", label: "Risk Register", icon: ClipboardList },
  { href: "/reports", label: "Reports", icon: FileSpreadsheet },
]

export async function AppShell({ children }: { children: React.ReactNode }) {
  const { profile } = await requireProfile()
  if (!profile) redirect("/login")
  const nav = [
    ...navBase,
    ...(canManageAdmin(profile.role)
      ? [{ href: "/admin", label: "Administration", icon: Users }]
      : []),
  ]

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="flex h-20 items-center gap-3 px-6">
          <div className="grid size-10 place-items-center rounded-lg bg-slate-950 text-white">
            <ShieldCheck />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Enterprise Risk</p>
            <h1 className="text-lg font-semibold">Risk Register</h1>
          </div>
        </div>
        <Separator />
        <nav className="flex flex-1 flex-col gap-1 p-4">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              <item.icon />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-4">
          <div className="mb-4 flex items-center gap-3">
            <Avatar>
              <AvatarFallback>{profile.full_name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{profile.full_name}</p>
              <p className="truncate text-xs text-slate-500">{roleLabels[profile.role]}</p>
            </div>
          </div>
          <form action={signOutAction}>
            <Button variant="outline" className="w-full justify-start">
              <LogOut data-icon="inline-start" />
              Sign out
            </Button>
          </form>
        </div>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <Building2 className="text-slate-500" />
            <div>
              <p className="text-sm font-semibold">
                {canSeeAllDepartments(profile.role) ? "All departments" : profile.department?.name}
              </p>
              <p className="text-xs text-slate-500">Arabic and English ready, RTL-compatible data model</p>
            </div>
          </div>
          <Link href="/risks/new">
            <Button>Add Risk</Button>
          </Link>
        </header>
        <main className="px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
