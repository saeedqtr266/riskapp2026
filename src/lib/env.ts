import { hasDatabaseEnv } from "@/lib/db"

export function hasAppEnv() {
  return hasDatabaseEnv()
}
