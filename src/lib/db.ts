import { neon } from "@neondatabase/serverless"

let sqlClient: ReturnType<typeof neon> | null = null

export function hasDatabaseEnv() {
  return Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL)
}

export function getSql() {
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL

  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL or POSTGRES_URL")
  }

  if (!sqlClient) {
    sqlClient = neon(databaseUrl)
  }

  return sqlClient
}
