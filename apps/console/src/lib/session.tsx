"use client"

import { createContext, useCallback, useContext, useEffect, useMemo } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AuthSession } from "@guidora/contracts"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  clearSession,
  selectCurrentUser,
  selectSessionLoading,
  setSessionError,
  setSessionLoading,
  setSessionUser,
} from "@/store/slices/session"
import {
  useLogoutMutation,
  useMeQuery,
} from "@/store/services/console-api"

type SessionState = {
  user: AuthSession["user"] | null
  loading: boolean
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

const SessionContext = createContext<SessionState | null>(null)

export function shouldShowSessionFallback({
  user,
}: Pick<SessionState, "loading" | "user">) {
  return !user
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectCurrentUser)
  const loading = useAppSelector(selectSessionLoading)
  const { data, error, isFetching, refetch } = useMeQuery()
  const [logoutRequest] = useLogoutMutation()
  const router = useRouter()
  const pathname = usePathname()

  const refresh = useCallback(async () => {
    dispatch(setSessionLoading(true))
    try {
      const session = await refetch().unwrap()
      dispatch(setSessionUser(session.user))
    } catch {
      dispatch(clearSession())
      router.replace(`/sign-in?next=${encodeURIComponent(pathname)}`)
    } finally {
      dispatch(setSessionLoading(false))
    }
  }, [dispatch, pathname, refetch, router])

  const logout = useCallback(async () => {
    await logoutRequest().unwrap()
    dispatch(clearSession())
    router.replace("/sign-in")
  }, [dispatch, logoutRequest, router])

  useEffect(() => {
    dispatch(setSessionLoading(isFetching))
  }, [dispatch, isFetching])

  useEffect(() => {
    if (data) {
      dispatch(setSessionUser(data.user))
    }
  }, [data, dispatch])

  useEffect(() => {
    if (!error) {
      return
    }

    dispatch(setSessionError("Unable to load session"))
    dispatch(clearSession())
    router.replace(`/sign-in?next=${encodeURIComponent(pathname)}`)
  }, [dispatch, error, pathname, router])

  const value = useMemo(() => ({ user, loading, refresh, logout }), [user, loading, refresh, logout])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const session = useContext(SessionContext)

  if (!session) {
    throw new Error("useSession must be used inside SessionProvider")
  }

  return session
}

export function SessionGate({ children }: { children: React.ReactNode }) {
  const { loading, user } = useSession()

  if (shouldShowSessionFallback({ loading, user })) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-muted-foreground mt-2">Loading session...</p>
        </div>
      </div>
    )
  }

  return children
}
