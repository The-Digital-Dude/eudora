import { describe, expect, it } from "vitest"
import { PERMISSIONS } from "@guidora/contracts"

import { shouldShowSessionFallback } from "../src/lib/session"

const user = {
  id: "user-1",
  email: "admin@guidora.test",
  name: "Admin User",
  status: "ACTIVE" as const,
  permissions: [PERMISSIONS.DASHBOARD_READ],
  role: {
    id: "role-1",
    key: "ADMIN" as const,
    name: "Admin",
  },
}

describe("SessionGate", () => {
  it("does not block the dashboard while refreshing when a user is already known", () => {
    expect(shouldShowSessionFallback({ loading: true, user })).toBe(false)
  })

  it("blocks the dashboard until a user exists", () => {
    expect(shouldShowSessionFallback({ loading: true, user: null })).toBe(true)
    expect(shouldShowSessionFallback({ loading: false, user: null })).toBe(true)
  })
})
