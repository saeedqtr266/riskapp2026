import "server-only"

import { randomBytes, createHash } from "node:crypto"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { getSql, hasDatabaseEnv } from "@/lib/db"
import type { Profile } from "@/lib/risk/types"

const sessionCookieName = "riskapp_session"
const sessionMaxAgeSeconds = 60 * 60 * 24 * 7

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export async function getCurrentSessionToken() {
  const cookieStore = await cookies()
  return cookieStore.get(sessionCookieName)?.value ?? null
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url")
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + sessionMaxAgeSeconds * 1000).toISOString()
  const sql = getSql()

  await sql`
    insert into app_sessions (user_id, token_hash, expires_at)
    values (${userId}, ${tokenHash}, ${expiresAt})
  `

  const cookieStore = await cookies()
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionMaxAgeSeconds,
  })
}

export async function destroyCurrentSession() {
  const token = await getCurrentSessionToken()
  const cookieStore = await cookies()
  cookieStore.delete(sessionCookieName)

  if (!token || !hasDatabaseEnv()) return

  const sql = getSql()
  await sql`delete from app_sessions where token_hash = ${hashToken(token)}`
}

export async function authenticateUser(email: string, password: string) {
  const sql = getSql()
  const users = await sql`
    select id, password_hash
    from profiles
    where lower(email) = lower(${email}) and active = true
    limit 1
  `

  const user = (users as { id: string; password_hash: string }[])[0]
  if (!user) return null

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) return null

  return user.id
}

export async function getSessionProfile() {
  const token = await getCurrentSessionToken()
  if (!token || !hasDatabaseEnv()) return null

  const sql = getSql()
  const rows = await sql`
    select
      p.id,
      p.email,
      p.full_name,
      p.role,
      p.department_id,
      d.id as department_id_joined,
      d.name as department_name,
      d.code as department_code
    from app_sessions s
    join profiles p on p.id = s.user_id
    left join departments d on d.id = p.department_id
    where s.token_hash = ${hashToken(token)}
      and s.expires_at > now()
      and p.active = true
    limit 1
  `

  const row = (rows as
    {
        id: string
        email: string
        full_name: string
        role: Profile["role"]
        department_id: string | null
        department_id_joined: string | null
        department_name: string | null
        department_code: string | null
      }[])[0]

  if (!row) return null

  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    role: row.role,
    department_id: row.department_id,
    department: row.department_id_joined
      ? {
          id: row.department_id_joined,
          name: row.department_name ?? "",
          code: row.department_code ?? "",
        }
      : null,
  } satisfies Profile
}
