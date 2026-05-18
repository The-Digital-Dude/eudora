import { afterEach, describe, expect, it, vi } from "vitest"
import { PERMISSIONS } from "@guidora/contracts"

import { makeStore } from "../src/store/store"
import {
  clearSession,
  sessionReducer,
  setSessionError,
  setSessionLoading,
  setSessionUser,
} from "../src/store/slices/session/sessionSlice"
import {
  selectCanCreateUsers,
  selectCanDisableUsers,
  selectCanReadUsers,
  selectCanResetPasswords,
  selectCanUpdateUsers,
  selectCurrentUser,
  selectIsOwner,
  selectSessionError,
  selectSessionLoading,
} from "../src/store/slices/session/sessionSelectors"
import {
  clearTemporaryPassword,
  closeUserDialog,
  openCreateUserDialog,
  openEditUserDialog,
  selectActiveUserDialog,
  selectSelectedUserId,
  selectTemporaryPassword,
  showTemporaryPassword,
  usersReducer,
} from "../src/store/slices/users"
import {
  closeThemeCustomizer,
  setThemeCustomizerTab,
  uiReducer,
  openThemeCustomizer,
} from "../src/store/slices/ui/uiSlice"
import {
  selectIsThemeCustomizerOpen,
  selectThemeCustomizerTab,
} from "../src/store/slices/ui/uiSelectors"
import {
  consoleApi,
  consoleBaseQuery,
} from "../src/store/services/console-api"

const user = {
  id: "user-1",
  email: "admin@guidora.test",
  name: "Admin User",
  status: "ACTIVE" as const,
  permissions: [PERMISSIONS.USERS_READ],
  role: {
    id: "role-1",
    key: "ADMIN" as const,
    name: "Admin",
  },
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("session slice", () => {
  it("stores loading, user, and error state", () => {
    let state = sessionReducer(undefined, setSessionLoading(true))
    expect(state.loading).toBe(true)

    state = sessionReducer(state, setSessionUser(user))
    expect(state.user).toEqual(user)
    expect(state.loading).toBe(false)
    expect(state.error).toBeNull()

    state = sessionReducer(state, setSessionError("Unauthorized"))
    expect(state.error).toBe("Unauthorized")

    state = sessionReducer(state, clearSession())
    expect(state.user).toBeNull()
    expect(state.loading).toBe(false)
  })

  it("selects current user's RBAC capabilities", () => {
    const store = makeStore()

    store.dispatch(setSessionUser({
      ...user,
      permissions: [
        PERMISSIONS.USERS_READ,
        PERMISSIONS.USERS_CREATE,
        PERMISSIONS.USERS_UPDATE,
        PERMISSIONS.USERS_DISABLE,
        PERMISSIONS.USERS_RESET_PASSWORD,
      ],
      role: {
        id: "role-owner",
        key: "OWNER",
        name: "Owner",
      },
    }))

    const state = store.getState()
    expect(selectIsOwner(state)).toBe(true)
    expect(selectCanReadUsers(state)).toBe(true)
    expect(selectCanCreateUsers(state)).toBe(true)
    expect(selectCanUpdateUsers(state)).toBe(true)
    expect(selectCanDisableUsers(state)).toBe(true)
    expect(selectCanResetPasswords(state)).toBe(true)
  })
})

describe("users UI slice", () => {
  it("tracks the active user-management dialog and temporary password", () => {
    let state = usersReducer(undefined, openCreateUserDialog())
    expect(selectActiveUserDialog({ users: state } as never)).toBe("create")
    expect(selectSelectedUserId({ users: state } as never)).toBeNull()

    state = usersReducer(state, openEditUserDialog("user-2"))
    expect(selectActiveUserDialog({ users: state } as never)).toBe("edit")
    expect(selectSelectedUserId({ users: state } as never)).toBe("user-2")

    state = usersReducer(state, showTemporaryPassword("temp-pass-123"))
    expect(selectTemporaryPassword({ users: state } as never)).toBe("temp-pass-123")

    state = usersReducer(state, clearTemporaryPassword())
    expect(selectTemporaryPassword({ users: state } as never)).toBeNull()

    state = usersReducer(state, closeUserDialog())
    expect(selectActiveUserDialog({ users: state } as never)).toBeNull()
    expect(selectSelectedUserId({ users: state } as never)).toBeNull()
  })
})

describe("ui slice", () => {
  it("stores global UI preferences", () => {
    let state = uiReducer(undefined, openThemeCustomizer())
    expect(state.themeCustomizerOpen).toBe(true)

    state = uiReducer(state, setThemeCustomizerTab("layout"))
    expect(state.themeCustomizerTab).toBe("layout")

    state = uiReducer(state, closeThemeCustomizer())
    expect(state.themeCustomizerOpen).toBe(false)
  })
})

describe("console store", () => {
  it("registers slice reducers and the RTK Query reducer", () => {
    const store = makeStore()
    const state = store.getState()

    expect(selectCurrentUser(state)).toBeNull()
    expect(selectSessionLoading(state)).toBe(false)
    expect(selectSessionError(state)).toBeNull()
    expect(state.users).toBeDefined()
    expect(selectIsThemeCustomizerOpen(state)).toBe(false)
    expect(selectThemeCustomizerTab(state)).toBe("theme")
    expect(state[consoleApi.reducerPath]).toBeDefined()
  })
})

describe("console RTK Query base query", () => {
  it("unwraps successful API responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        json: async () => ({ success: true, data: { ok: true } }),
      }))
    )

    const result = await consoleBaseQuery(
      { url: "/health" },
      {} as never,
      {}
    )

    expect(result).toEqual({ data: { ok: true } })
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3001/health",
      expect.objectContaining({
        credentials: "include",
        headers: expect.objectContaining({
          "content-type": "application/json",
        }),
      })
    )
  })

  it("converts API failures into RTK Query errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        status: 401,
        json: async () => ({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Sign in required",
          },
        }),
      }))
    )

    const result = await consoleBaseQuery(
      { url: "/auth/me" },
      {} as never,
      {}
    )

    expect(result).toEqual({
      error: {
        status: 401,
        data: {
          code: "UNAUTHORIZED",
          message: "Sign in required",
        },
      },
    })
  })
})
