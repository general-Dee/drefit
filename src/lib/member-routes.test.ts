import { describe, it, expect } from "vitest"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

// Guardrail: every member data API route must go through requireMember().
const MEMBER_API_DIRS = ["workouts", "diet", "dashboard", "coaching", "community", "progress"]
const API_ROOT = join(__dirname, "..", "app", "api")

function routeFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) return routeFiles(p)
    return name === "route.ts" ? [p] : []
  })
}

const files = MEMBER_API_DIRS.flatMap((d) => routeFiles(join(API_ROOT, d)))

describe("member API routes", () => {
  it("finds the member routes", () => {
    expect(files.length).toBeGreaterThanOrEqual(13)
  })

  for (const file of files) {
    it(`${file.slice(API_ROOT.length)} guards every handler with requireMember`, () => {
      const src = readFileSync(file, "utf8")
      const handlers = src.match(/export async function (GET|POST|PUT|PATCH|DELETE)/g) ?? []
      const guards = src.match(/await requireMember\(\)/g) ?? []
      expect(handlers.length).toBeGreaterThan(0)
      expect(guards.length).toBe(handlers.length)
      expect(src).not.toMatch(/\bawait auth\(\)/)
    })
  }
})
